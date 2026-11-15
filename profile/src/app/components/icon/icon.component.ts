import { Component, Input } from '@angular/core';
import {
  faMagnifyingGlass,
  faPuzzlePiece,
  faRobot,
  faCodeBranch,
  faBrain,
  faListCheck,
  faArrowLeft,
  faArrowRight,
  faArrowRightArrowLeft,
  faArrowRotateLeft,
  faChartLine,
  faCheck,
  faChevronDown,
  faCopy,
  faCodeMerge,
  faDiagramProject,
  faEllipsis,
  faEye,
  faExpand,
  faCompress,
  faFileImport,
  faFileLines,
  faFloppyDisk,
  faFolderOpen,
  faGear,
  faKey,
  faLock,
  faMessage,
  faPaperPlane,
  faPenToSquare,
  faPlus,
  faPlug,
  faRightFromBracket,
  faRightToBracket,
  faRotateRight,
  faTrashCan,
  faLinkSlash,
  faUpload,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

/** Shared action/navigation vocabulary; SVGs inherit the surrounding text colour. */
const icons = {
  search: faMagnifyingGlass,
  skills: faPuzzlePiece,
  agents: faRobot,
  workflows: faCodeBranch,
  memory: faBrain,
  workBoard: faListCheck,
  arrow: faArrowRight,
  back: faArrowLeft,
  check: faCheck,
  close: faXmark,
  copy: faCopy,
  delete: faTrashCan,
  edit: faPenToSquare,
  expand: faExpand,
  collapse: faCompress,
  file: faFileLines,
  folder: faFolderOpen,
  import: faFileImport,
  key: faKey,
  lock: faLock,
  login: faRightToBracket,
  logout: faRightFromBracket,
  disconnect: faLinkSlash,
  merge: faCodeMerge,
  messages: faMessage,
  more: faEllipsis,
  moreDown: faChevronDown,
  move: faArrowRightArrowLeft,
  plus: faPlus,
  plug: faPlug,
  preview: faEye,
  projects: faDiagramProject,
  refresh: faRotateRight,
  reset: faArrowRotateLeft,
  save: faFloppyDisk,
  send: faPaperPlane,
  settings: faGear,
  analytics: faChartLine,
  upload: faUpload,
};
@Component({
  selector: 'wo-icon',
  templateUrl: './icon.component.html',
  host: { class: 'inline-icon', 'aria-hidden': 'true' },
})
export class IconComponent {
  @Input() name: keyof typeof icons = 'arrow';
  get viewBox(): string {
    const icon = icons[this.name].icon;

    return `0 0 ${icon[0]} ${icon[1]}`;
  }
  get path(): string {
    const path = icons[this.name].icon[4];

    return Array.isArray(path) ? path.join(' ') : path;
  }
}
