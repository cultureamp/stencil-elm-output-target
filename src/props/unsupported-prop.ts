import { Prop } from './prop';

export class UnsupportedProp extends Prop {
  isSupported(): boolean {
    return false;
  }
}
