export class Grocery {
  constructor(
    public id: string,
    public name: string,
    public done: boolean,
    public deleted: boolean,
    public getToday: boolean,
    public createdate?: string
  ) {}
}