import { Component } from '@angular/core';
import { LegalPage } from '../../../shared/legal-page/legal-page';

/** Terms of Service page (content projected into the shared {@link LegalPage}). */
@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [LegalPage],
  templateUrl: './terms.html',
})
export class TermsPage {}
