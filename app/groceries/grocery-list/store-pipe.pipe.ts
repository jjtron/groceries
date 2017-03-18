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
  }
}

@Pipe({
  name: 'PrefixPipe'
})
export class PrefixPipe {
  transform(groceryName: string): string {
    if (groceryName.substr(0, 2) === "x ") {
       return groceryName.substr(2);
    } else {
       return groceryName;
    }
  }
}
