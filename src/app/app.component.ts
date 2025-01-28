import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(private changeDetectorRef: ChangeDetectorRef){}

  /**
   * Possível Correção - ADICIONAR UM NG IF NO VIDEO ENQUANTO INVERTE A CAMERA
   */

  currentStream: MediaStream | null = null;

  @ViewChild('videoElement')
  videoElement!: ElementRef<HTMLVideoElement>

  frontCamera = true;

  title = 'teste-camera';

  ngOnInit(): void {
    this.iniciarCamera();
  }

  iniciarCamera() {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      })
        .then((stream) => {
          this.currentStream = stream;
          this.videoElement.nativeElement.srcObject = stream;
        })
    }
  }

  async inverterCamera() {
    try {
      const videoDevices = await this.dispositivos();

      if (videoDevices.length === 0) {
        console.error('Nenhuma câmera encontrada.');
        return;
      }

      // Alterna entre frontal e traseira usando `facingMode` se disponível
      this.frontCamera = !this.frontCamera;
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: this.frontCamera ? 'user' : 'environment'
        }
      };

      // Tentar obter a câmera com `facingMode`
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.changeDetectorRef.detectChanges();
      } catch (error) {
        console.warn('facingMode não suportado. Tentando selecionar a câmera pelo índice.');
      }

      // Caso `facingMode` não funcione, alterna entre a primeira e a segunda câmeras manualmente
      if (!stream) {
        const selectedDeviceId = this.frontCamera ? videoDevices[0].deviceId : videoDevices[1]?.deviceId;
        if (!selectedDeviceId) {
          console.error('Câmera traseira não disponível.');
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        });

        this.changeDetectorRef.detectChanges();
      }

      // Parar o stream de vídeo atual antes de iniciar o novo
      if (this.videoElement.nativeElement.srcObject) {
        const currentStream = this.videoElement.nativeElement.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        this.changeDetectorRef.detectChanges();
      }

      // Configura o novo stream no elemento de vídeo
      this.videoElement.nativeElement.srcObject = stream;
      this.changeDetectorRef.detectChanges();

    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
    }
  }

  async dispositivos() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices: MediaDeviceInfo[] = devices.filter(device => device.kind === 'videoinput');
    return videoDevices;
  }

}
