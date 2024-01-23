import { MenuItem } from './menu.model';

let menuId = 0;
export function createMenuId() {
  return menuId++;
}

export const MENU: MenuItem[] = [
  {
    id: createMenuId(),
    label: 'Main',
    isTitle: true
  },
  {
    id: createMenuId(),
    label: 'Dashboard',
    icon: 'home',
    link: ''
  },
  {
    id: createMenuId(),
    label: 'Supplies Input',
    icon: 'box',
    link: 'input'
  },
  {
    id: createMenuId(),
    label: 'Prodplan',
    icon: 'dollar-sign',
    link: 'prodplan'
  },
  {
    id: createMenuId(),
    label: 'Users',
    icon: 'user',
    link: 'users'
  },
];
