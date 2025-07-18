import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { IonContent, IonMenu, LoadingController, MenuController, ModalController, ToastController } from '@ionic/angular';
import { Observable, map, subscribeOn } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';

@Component({
  selector: 'app-surah',
  templateUrl: './surah.page.html',
  styleUrls: ['./surah.page.scss'],
})
export class SurahPage implements OnInit {
  @ViewChild(IonContent) contents: IonContent;
  @ViewChild(IonMenu) menu: IonMenu;
  @Input() surahName: string;
  @Input() surahNumber: string;

  surahText: any[] = [];
  surahTextTranslation: any[] = [];
  currentAyahNumber: number | null = null;
  audioPlayer: HTMLAudioElement;
  fontSize: number = 18; // Default font size
  darkMode: boolean = false; // Track the dark mode state
  translationMode: boolean= false;
  ayahNumber: number; // go to ayah feature
  reciters: any[] = [];
  selectedReciterId: string = 'ar.muhammadayyoub';


  @ViewChild('audioPlayer', { static: true }) set content(content: any) {
    if (content) { // check if content is defined
      this.audioPlayer = content.nativeElement;
      this.audioPlayer.onended = () => {
        this.currentAyahNumber = null; // Reset currentAyahNumber when audio ends
      };
    }
  };

  constructor(
    private modalController: ModalController,
    private httpService: HttpService,
    private loadingController: LoadingController,
    private menuController: MenuController,
    private socialSharing: SocialSharing,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    const loading = await this.loadingController.create();
    await loading.present();
    this.getRecitersList();
    this.getSurahArabicText();
    await loading.dismiss();
  }

  getRecitersList(){
    this.httpService.getRecitersForAyah().subscribe(data => {
    this.reciters = data;
    });
  }

  onReciterChange() {
    this.getSurahArabicText();
  }

  close() {
    this.modalController.dismiss();
  }

  closeMenu() {
    this.menu.close();
  }

  scrollToDown() {
    this.contents.scrollToBottom(700);
  }

  scrollToTop() {
    this.contents.scrollToTop(700);
  }

  openMenu() {
    this.menuController.open('fontSizeMenu'); // Open the menu with the specified ID
  }

  updateFontSize() {
    this.contents.getScrollElement().then((scrollElement) => {
      scrollElement.style.setProperty('--font-size', `${this.fontSize}px`);
    });
  }

  // getSurahArabicText() {
  //   const reciterId = this.selectedReciterId || 'ar.muhammadayyoub';
  //   const translationEdition = 'en.asad';
  //   const apiUrl = `https://api.alquran.cloud/v1/surah/${this.surahNumber}/editions/${reciterId},${translationEdition}`;

  //   this.surahText = this.httpService.getSurahList(apiUrl).pipe(
  //     map((res: any) => {
  //       const arabicAyahs = res.data[0].ayahs;
  //       this.surahTextTranslation = res.data[1].ayahs;

  //       return arabicAyahs; // ayahs already include .audio field from API!
  //     })
  //   );
  // }
  getSurahArabicText() {
    const arabicEditionId = this.selectedReciterId || 'ar.muhammadayyoub';
    const translationEdition = 'en.asad';
    const apiUrl = `https://api.alquran.cloud/v1/surah/${this.surahNumber}/editions/${arabicEditionId},${translationEdition}`;

    this.httpService.getSurahList(apiUrl).subscribe((res: any) => {
      this.surahText = res.data[0]?.ayahs || [];
      this.surahTextTranslation = res.data[1]?.ayahs || [];
    });
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    const mainContent = document.getElementById('main-content');
    if (this.darkMode) {
      mainContent?.classList.add('dark-mode');
    } else {
      mainContent?.classList.remove('dark-mode');
    }
  }

  toggleTranslationMode() {
    this.translationMode = !this.translationMode;
  }

  shareAyah(ayahText: string, translation: string) {
    const options = {
      message: ayahText + "\n" + translation + "\n\n-" + this.surahName,
      subject: "Quran Ayah",
    };
    
    console.log("OPTIONS ", options);
    
    this.socialSharing.shareWithOptions(options)
    .then(res => {
      console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  // playAudio(ayahNumber: number, audioUrl: string) {
  //   const audio = this.audioPlayer;
  //   if (this.currentAyahNumber === ayahNumber) {
  //     if (audio.paused) {
  //       audio.play();
  //     } else {
  //       audio.pause();
  //     }
  //   } else {
  //     this.currentAyahNumber = ayahNumber;
  //     audio.src = audioUrl;
  //     audio.load();
  //     audio.oncanplaythrough = () => {
  //       audio.play();
  //     };
      
  //   }
  // }
  nextAudioPlayer = new Audio();
  playAudio(ayahNumber: number, audioUrl: string) {
    const audio = this.audioPlayer;

    audio.onended = null;
    audio.oncanplaythrough = null;

    if (this.currentAyahNumber === ayahNumber) {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    } else {
      this.currentAyahNumber = ayahNumber;
      audio.src = audioUrl;
      audio.load();

      audio.oncanplaythrough = () => {
        audio.play();

        // 🔁 Preload next ayah
        const currentIndex = this.surahText.findIndex(
          ayah => ayah.number === ayahNumber
        );
        const nextAyah = this.surahText[currentIndex + 1];
        if (nextAyah) {
          this.nextAudioPlayer.src = nextAyah.audio;
          this.nextAudioPlayer.load(); // Start preloading
        }
      };

      audio.onended = () => {
        const currentIndex = this.surahText.findIndex(
          ayah => ayah.number === this.currentAyahNumber
        );

        const nextAyah = this.surahText[currentIndex + 1];
        if (nextAyah) {
          this.playAudio(nextAyah.number, nextAyah.audio);
        } else {
          this.currentAyahNumber = null;
          audio.pause();
          audio.src = '';
        }
      };
    }
  }

  toggleGlobalPlayPause() {
    const audio = this.audioPlayer;

    // If nothing is playing yet, start from the first ayah
    if (!this.currentAyahNumber || !audio.src) {
      if (this.surahText && this.surahText.length > 0) {
        const firstAyah = this.surahText[0];
        this.playAudio(firstAyah.number, firstAyah.audio);
      }
      return;
    }

    // Otherwise, toggle pause/resume
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  async onSearchAyah(event: any) {
    const ayahNumber = event.target.value;
    // Check if the input is empty
    if (!ayahNumber) {
      return; // Do nothing if input is empty
    }
    
    const element = document.getElementById(`ayah-${ayahNumber}`);
    if (element) {
      this.contents.scrollToPoint(0, element.offsetTop, 700);
    } else {
      // Show toast message when Ayah number is out of range
      const toast = await this.toastController.create({
        message: `Ayah number ${ayahNumber} out of range!`,
        duration: 1500,
        color: 'danger',
        buttons: [
          {
            role: 'cancel',
            text: 'X'
          }
        ],
      });
      toast.present();
    }
  }

}
