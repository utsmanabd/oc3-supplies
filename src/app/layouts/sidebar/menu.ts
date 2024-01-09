import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    id: 1,
    label: 'Main',
    isTitle: true
  },
  {
    id: 2,
    label: 'Dashboard',
    icon: 'home',
    link: ''
  },
  {
    id: 3,
    label: 'Input',
    icon: 'edit',
    link: 'input'
  }
];
