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
    label: 'Supplies',
    icon: 'layers',
    link: 'supplies'
  },
  {
    id: createMenuId(),
    label: 'Prodplan',
    icon: 'list',
    link: 'prodplan'
  },
  {
    id: createMenuId(),
    label: 'Master Data',
    isTitle: true
  },
  {
    id: createMenuId(),
    label: 'Material',
    icon: 'box',
    link: 'master/material'
  },
  {
    id: createMenuId(),
    label: 'Cost Center',
    icon: 'dollar-sign',
    link: 'master/cost-center'
  },
  {
    id: createMenuId(),
    label: 'Calculation Budget',
    icon: 'percent',
    link: 'master/calc-budget'
  },
  {
    id: createMenuId(),
    label: 'Users',
    icon: 'users',
    link: 'master/users'
  },
];

// export const MASTER_MENU: MenuItem[] = [
  
// ]
