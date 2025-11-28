import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true,
  pure: false 
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], property: string, value: any): any[] {
    if (!items || !property) {
      return items;
    }

    if (value === null || value === undefined || value === '') {
      return items;
    }

    return items.filter(item => {
      const itemValue = this.getNestedProperty(item, property);
      
      if (itemValue === null || itemValue === undefined) {
        return false;
      }

      if (typeof value === 'string' && typeof itemValue === 'string') {
        return itemValue.toLowerCase().includes(value.toLowerCase());
      }

      return itemValue === value;
    });
  }

  private getNestedProperty(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }
}