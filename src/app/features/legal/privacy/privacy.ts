import { Component } from '@angular/core';
import { LegalPage } from '../../../shared/legal-page/legal-page';

/** Privacy Policy page (content projected into the shared {@link LegalPage}). */
@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [LegalPage],
  templateUrl: './privacy.html',
})
export class PrivacyPage {}
