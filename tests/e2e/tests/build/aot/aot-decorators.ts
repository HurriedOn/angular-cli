import {ng} from '../../../utils/process';
import {appendToFile, expectFileToMatch, prependToFile, replaceInFile} from '../../../utils/fs';
import {expectToFail} from '../../../utils/utils';
import {getGlobalVariable} from '../../../utils/env';

export default function() {

  // TODO: re-enable this test for ng5
  // now we only remove decorators via --build-optimizer
  if (getGlobalVariable('argv').nightly) {
    return Promise.resolve();
  }

  return ng('generate', 'component', 'test-component', '--module', 'app.module.ts')
    .then(() => prependToFile('src/app/test-component/test-component.component.ts', `
      import { Optional, SkipSelf } from '@angular/core';
    `))
    .then(() => replaceInFile('src/app/test-component/test-component.component.ts',
      /constructor.*/, `
        constructor(@Optional() @SkipSelf() public test: TestComponentComponent) {
          console.log(test);
        }
      `))
    .then(() => appendToFile('src/app/app.component.html', `
      <app-test-component></app-test-component>
    `))
    .then(() => ng('build', '--aot'))
    .then(() => expectToFail(() => expectFileToMatch('dist/main.bundle.js', /\bComponent\b/)))
    // Check that the decorators are still kept.
    .then(() => expectFileToMatch('dist/main.bundle.js', /ctorParameters.*Optional.*SkipSelf/))
    .then(() => expectToFail(() => expectFileToMatch('dist/main.bundle.js', /\bNgModule\b/)));
}
