import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'tab4',
    loadChildren: () => import('./tabs_folder/tab4/tab4.module').then( m => m.Tab4PageModule)
  },
  {
    path: 'tab5',
    loadChildren: () => import('./tabs_folder/tab5/tab5.module').then( m => m.Tab5PageModule)
  },
  {
    path: 'image-modal',
    loadChildren: () => import('./pages/image-modal/image-modal.module').then( m => m.ImageModalPageModule)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'quran',
    loadChildren: () => import('./tabs_folder/quran/quran.module').then( m => m.QuranPageModule)
  },
  {
    path: 'surah/:id',
    loadChildren: () => import('./pages/surah/surah.module').then( m => m.SurahPageModule)
  }

];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
