import { Component, OnInit, HostBinding, NgZone, ElementRef, Inject, ContentChild, TemplateRef, Input } from '@angular/core';
import { GanttDomService, ScrollDirection } from './gantt-dom.service';
import { GanttDragContainer } from './gantt-drag-container';
import { take, takeUntil, startWith } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { GanttUpper, GANTT_UPPER_TOKEN } from './gantt-upper';

@Component({
    selector: 'ngx-gantt-root',
    templateUrl: './root.component.html',
    providers: [GanttDomService, GanttDragContainer]
})
export class NgxGanttRootComponent implements OnInit {
    @Input() sideWidth: number;

    @HostBinding('class.gantt') ganttClass = true;

    @ContentChild('sideTemplate', { static: true }) sideTemplate: TemplateRef<any>;

    @ContentChild('mainTemplate', { static: true }) mainTemplate: TemplateRef<any>;

    private unsubscribe$ = new Subject();

    private get view() {
        return this.ganttUpper.view;
    }

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        private ngZone: NgZone,
        private dom: GanttDomService,
        public dragContainer: GanttDragContainer,
        @Inject(GANTT_UPPER_TOKEN) private ganttUpper: GanttUpper
    ) {
        this.ganttUpper.dragContainer = dragContainer;
    }

    ngOnInit() {
        this.ngZone.onStable.pipe(take(1)).subscribe(() => {
            this.dom.initialize(this.elementRef);
            this.setupViewScroll();
            // 优化初始化时Scroll滚动体验问题，通过透明度解决，默认透明度为0，滚动结束后恢复
            this.elementRef.nativeElement.style.opacity = '1';
            this.ganttUpper.viewChange.pipe(startWith(null)).subscribe(() => {
                this.scrollToToday();
            });
        });
    }

    private setupViewScroll() {
        if (this.ganttUpper.disabledLoadOnScroll) {
            return;
        }
        this.dom
            .getViewerScroll()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((event) => {
                if (event.direction === ScrollDirection.LEFT) {
                    const dates = this.view.addStartDate();
                    if (dates) {
                        event.target.scrollLeft += this.view.getDateRangeWidth(dates.start, dates.end);
                        this.ngZone.run(() => {
                            this.ganttUpper.loadOnScroll.emit({ start: dates.start.getUnixTime(), end: dates.end.getUnixTime() });
                        });
                    }
                }
                if (event.direction === ScrollDirection.RIGHT) {
                    const dates = this.view.addEndDate();
                    if (dates) {
                        this.ngZone.run(() => {
                            this.ganttUpper.loadOnScroll.emit({ start: dates.start.getUnixTime(), end: dates.end.getUnixTime() });
                        });
                    }
                }
            });
    }

    private scrollToToday() {
        const x = this.view.getTodayXPoint();
        this.dom.scrollMainContainer(x);
    }
}