import {Pipe} from '@angular/core';

@Pipe({
  name: 'StorePipe'
})
export class StorePipe {
  transform(array: any[], store: string): any[] {
    return array.filter((grocery) => {
        if (store === 'publix') {
            return grocery.name.startsWith("x ");
        } else if (store === 'aldis') {
            return !grocery.name.startsWith("x ");
        }
    });
//    .map((grocery) => {
//        if (store === 'publix') {
//            grocery.name = grocery.name.substr(2);
//            return grocery;
//        } else {
//            return grocery;
//        }
//    });
  }
}
