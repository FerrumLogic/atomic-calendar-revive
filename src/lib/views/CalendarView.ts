import dayjs from 'dayjs';
import { TemplateResult, html } from 'lit';

import { selectDayIcons } from '../../helpers/day-icons';
import { getEntityIcon } from '../../helpers/get-icon';
import { atomicCardConfig } from '../../types/config';
import { HomeAssistant } from '../../types/homeassistant';
import { ICardHost } from '../card-host.interface';
import { getCalendarDescriptionHTML, getCalendarLocationHTML, getTitleHTML } from '../common.html';
import { ICalendarView } from '../view.interface';
import { CalendarDay, MonthGrid } from './month-grid';

export class CalendarView implements ICalendarView {
	private grid: MonthGrid;
	private clickedDate: dayjs.Dayjs | null = null;
	private summaryHtml: TemplateResult | TemplateResult[] = html`&nbsp;`;
	private config!: atomicCardConfig;
	private hass!: HomeAssistant;

	constructor(private parent: ICardHost) {
		this.grid = new MonthGrid(parent);
	}

	get hasEvents(): boolean {
		return this.grid.hasEvents;
	}

	async update(hass: HomeAssistant, config: atomicCardConfig): Promise<void> {
		this.hass = hass;
		this.config = config;
		await this.grid.update(hass, config);
	}

	render(): TemplateResult {
		return this.grid.render({
			renderCellBody: (day) => html`
				${this.renderMultiDayBars(day)}
				<div class="iconDiv">${this.renderDayIcons(day)}</div>
			`,
			onCellClick: (day) => this.selectDay(day),
			cellHighlightClass: (day) => (dayjs(day.date).isSame(dayjs(this.clickedDate), 'day') ? 'active' : ''),
			renderAfter: () => html`<div class="summary-div">${this.summaryHtml}</div>`,
			onMonthLoaded: (month) => {
				if (this.clickedDate) return;
				const today = month.find((d) => dayjs(d.date).isSame(dayjs(), 'day'));
				if (today) this.summaryHtml = this.buildSummary(today);
			},
		});
	}

	private selectDay(day: CalendarDay): void {
		this.clickedDate = day.date;
		this.summaryHtml = this.buildSummary(day);
		this.parent.scheduleRender();
	}

	private buildSummary(day: CalendarDay): TemplateResult[] {
		return day.allEvents.map((event) => {
			const eventColor =
				typeof event.entityConfig.color !== 'undefined' ? event.entityConfig.color : this.config.defaultCalColor;
			const finishedEventsStyle =
				event.isFinished && this.config.dimFinishedEvents
					? `opacity: ${this.config.finishedEventOpacity}; filter: ${this.config.finishedEventFilter};`
					: '';

			if (event.isAllDayEvent) {
				const bulletType = event.isDeclined ? 'summary-fullday-div-declined' : 'summary-fullday-div-accepted';
				return html`<div class="${bulletType}" style="border-color: ${eventColor}; ${finishedEventsStyle}">
					<div class="event-summary-content" aria-hidden="true">
						${getTitleHTML(this.config, event, this.hass, 'Calendar')} ${getCalendarLocationHTML(this.config, event)}
						${this.config.calShowDescription ? getCalendarDescriptionHTML(this.config, event) : ''}
					</div>
				</div>`;
			}

			const showHours = event.entityConfig.showHours ?? this.config.showHours;
			const eventTime = showHours
				? html`<div class="hours">
						${event.startDateTime.format('LT')}${this.config.showEndTime ? `-${event.endDateTime.format('LT')}` : ''}
					</div>`
				: '';
			const bulletType = event.isDeclined ? 'bullet-event-div-declined' : 'bullet-event-div-accepted';
			return html`
				<div class="summary-event-div" style="color: ${eventColor}; ${finishedEventsStyle}">
					<div class="${bulletType}" style="border-color: ${eventColor}"></div>
					${eventTime} - ${getTitleHTML(this.config, event, this.hass, 'Calendar')}
					${getCalendarLocationHTML(this.config, event)}
					${this.config.calShowDescription ? getCalendarDescriptionHTML(this.config, event) : ''}
				</div>
			`;
		});
	}

	private renderMultiDayBars(day: CalendarDay): TemplateResult[] {
		const bars: TemplateResult[] = [];
		let stackIndex = 0;

		day.allEvents.forEach((event) => {
			// часть multi-day события: разбито (addDays задан) или растянуто в month-grid
			const isPart = event.daysLong && event.daysLong > 1;
			if (!isPart) return;

			const color =
				event.showCategoryIcon && event.categoryColor
					? event.categoryColor
					: (event.entityConfig.color ?? this.config.defaultCalColor);
			const roundedLeft = event.isFirstDay;
			const roundedRight = event.isLastDay;

			bars.push(html`
				<div
					class="cal-multiday-bar"
					style="background-color: ${color}; top: ${stackIndex * 5}px; ${
						roundedLeft ? 'border-top-left-radius: 3px; border-bottom-left-radius: 3px;' : ''
					} ${roundedRight ? 'border-top-right-radius: 3px; border-bottom-right-radius: 3px;' : ''}"
				></div>
			`);
			stackIndex++;
		});

		return bars;
	}

	private renderDayIcons(day: CalendarDay): TemplateResult[] {
		const iconsToShow = selectDayIcons(
			day.allEvents.map((event) => ({
				icon: event.entityConfig.icon,
				color: event.entityConfig.color,
				showCategoryIcon: event.showCategoryIcon,
				categories: event.categories,
				entity_id: event.entity.entity_id,
			})),
			(event) => getEntityIcon(event.entity_id ?? '', this.hass),
		);

		return iconsToShow.map((ic) =>
			ic.icon.includes(':')
				? html`<span>
						<ha-icon icon="${ic.icon}" class="calIcon" style="color: ${ic.color};"></ha-icon>
					</span>`
				: html`<span class="calIcon" aria-hidden="true" style="color: ${ic.color}; font-size: 16px; line-height: 16px;"
						>${ic.icon}</span
					>`,
		);
	}
}
