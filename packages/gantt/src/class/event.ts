import { GanttItem } from './item';

export class GanttDragEvent {
    item: GanttItem;
}

export class GanttLinkDragEvent {
    source: GanttItem;
    dependent?: GanttItem;
}

export class GanttLoadOnScrollEvent {
    start: number;
    end: number;
}

export class GanttDependencyEvent {
  event: MouseEvent;
  source: GanttItem;
  dependent: GanttItem;
}