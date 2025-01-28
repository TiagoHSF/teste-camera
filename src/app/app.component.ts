import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(private changeDetectorRef: ChangeDetectorRef) { }

  currentStream: MediaStream | null = null;

  @ViewChild('videoElement')
  videoElement!: ElementRef<HTMLVideoElement>

  frontCamera = true;
  isLoading = false; // Adicionado para feedback visual

  title = 'teste-camera';

  ngOnInit(): void {
    this.iniciarCamera();
  }

  async iniciarCamera() {
    try {
      const stream = await this.obterStreamDaCamera();
      this.currentStream = stream;
      this.videoElement.nativeElement.srcObject = stream;
    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
    }
  }

  async inverterCamera() {
    if (this.isLoading) return; // Evita múltiplos cliques durante a troca
    this.isLoading = true; // Ativa o indicador de carregamento

    try {
      // Parar o stream de vídeo atual
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
      }

      // Alterna entre frontal e traseira
      this.frontCamera = !this.frontCamera;

      // Obtém o novo stream da câmera
      const stream = await this.obterStreamDaCamera();
      this.currentStream = stream;
      this.videoElement.nativeElement.srcObject = stream;

    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
    } finally {
      this.isLoading = false; // Desativa o indicador de carregamento
    }
  }

  private async obterStreamDaCamera(): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
        facingMode: this.frontCamera ? 'user' : 'environment'
      }
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.warn('facingMode não suportado. Tentando selecionar a câmera pelo índice.');

      const videoDevices = await this.dispositivos();
      const selectedDeviceId = this.frontCamera ? videoDevices[0].deviceId : videoDevices[1]?.deviceId;
      if (!selectedDeviceId) {
        throw new Error('Câmera traseira não disponível.');
      }

      return await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });
    }
  }

  private async dispositivos(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  }

  getVideoTransform(): string {
    // Se for a câmera frontal, não aplicamos scaleX(-1) porque a câmera já espelha a imagem
    if (this.frontCamera) {
      return 'scaleX(1)'; // Mantém a imagem como está (já espelhada pela câmera frontal)
    } else {
      return 'scaleX(-1)'; // Inverte a imagem para a câmera traseira, se necessário
    }
  }
}