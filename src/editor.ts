import dayjs from 'dayjs';
import { LitElement, TemplateResult, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import memoizeOne from 'memoize-one';

import { fireEvent } from './common/fire-event';
import defaults from './defaults';
import {
	appearanceSchema,
	calendarSchema,
	categorySchema,
	entitySchema,
	eventSchema,
	mainSchema,
	plannerSchema,
} from './editor-schema';
import { DEFAULT_CATEGORY_MAP } from './helpers/category';
import { style } from './style-editor';
import { atomicCardConfig } from './types/config';
import { HomeAssistant } from './types/homeassistant';
import { LovelaceCardEditor } from './types/lovelace';

const entityCategorySchema = [
	{ name: 'icon', label: 'Icon', selector: { icon: {} } },
	{ name: 'color', label: 'Color', selector: { color: {} } },
];

@customElement('atomic-calendar-revive-editor')
export class AtomicCalendarReviveEditor extends LitElement implements LovelaceCardEditor {
	@property({ attribute: false }) public hass!: HomeAssistant;
	@state() private _config!: atomicCardConfig;
	@state() private _helpers?: any;
	private _initialized = false;

	static get styles() {
		return [
			style,
			css`
				.card-config {
					display: flex;
					flex-direction: column;
					gap: 16px;
				}
				.option {
					padding: 4px 0;
					cursor: pointer;
				}
				.row {
					display: flex;
					align-items: center;
					margin-bottom: 8px;
				}
				.title {
					font-size: 16px;
					font-weight: bold;
					margin-left: 8px;
				}
				.secondary {
					color: var(--secondary-text-color);
				}
				.values {
					padding-left: 16px;
					background: var(--secondary-background-color);
					padding: 16px;
				}
				ha-expansion-panel {
					margin-bottom: 8px;
				}
			`,
		];
	}

	public setConfig(config: atomicCardConfig): void {
		this._config = { ...defaults, ...config };
		this.loadCardHelpers();
	}

	protected shouldUpdate(): boolean {
		if (!this._initialized) {
			this._initialize();
		}
		return true;
	}

	private _initialize(): void {
		if (this.hass === undefined) return;
		if (this._config === undefined) return;
		if (this._helpers === undefined) return;
		this._initialized = true;
	}

	private async loadCardHelpers(): Promise<void> {
		this._helpers = await (window as any).loadCardHelpers();
	}

	private _computeSchema = memoizeOne((schema: any[]) => {
		return schema.map((field) => {
			if (field.name === 'firstDayOfWeek') {
				const weekdays = dayjs.weekdays();
				const options = weekdays.map((day, index) => ({
					value: index,
					label: day,
				}));
				return {
					...field,
					selector: {
						select: {
							options: options,
							mode: 'dropdown',
						},
					},
				};
			}
			return field;
		});
	});

	protected render(): TemplateResult | void {
		if (!this.hass || !this._helpers) {
			return html``;
		}

		// Ensure dayjs locale is set
		if (this.hass.language) {
			dayjs.locale(this.hass.language.toLowerCase());
		}

		return html`
			<div class="card-config">
				<div class="sponsor">
					<div>
						Please consider sponsoring this project. <br />
						This will help keep the project alive and continue development.
					</div>
					<div class="badge">
						<a href="https://github.com/sponsors/marksie1988" target="_blank">
							<img
								src="https://img.shields.io/badge/sponsor-000?style=for-the-badge&logo=githubsponsors&logoColor=red"
							/>
						</a>
					</div>
				</div>
				<ha-expansion-panel outlined>
					<div slot="header" class="title">Main Settings</div>
					<div class="values">
						<ha-form
							.hass=${this.hass}
							.data=${this._config}
							.schema=${this._computeSchema(mainSchema)}
							.computeLabel=${this._computeLabel}
							@value-changed=${this._valueChanged}
						></ha-form>
					</div>
				</ha-expansion-panel>

				<ha-expansion-panel outlined>
					<div slot="header" class="title">Event Mode</div>
					<div class="values">
						<ha-form
							.hass=${this.hass}
							.data=${this._config}
							.schema=${eventSchema}
							.computeLabel=${this._computeLabel}
							@value-changed=${this._valueChanged}
						></ha-form>
					</div>
				</ha-expansion-panel>

				<ha-expansion-panel outlined>
					<div slot="header" class="title">Calendar Mode</div>
					<div class="values">
						<ha-form
							.hass=${this.hass}
							.data=${this._config}
							.schema=${calendarSchema}
							.computeLabel=${this._computeLabel}
							@value-changed=${this._valueChanged}
						></ha-form>
					</div>
				</ha-expansion-panel>

				<ha-expansion-panel outlined>
					<div slot="header" class="title">Planner Mode</div>
					<div class="values">
						<ha-form
							.hass=${this.hass}
							.data=${this._config}
							.schema=${plannerSchema}
							.computeLabel=${this._computeLabel}
							@value-changed=${this._valueChanged}
						></ha-form>
					</div>
				</ha-expansion-panel>

				<ha-expansion-panel outlined>
					<div slot="header" class="title">Appearance</div>
					<div class="values">
						<ha-form
							.hass=${this.hass}
							.data=${this._config}
							.schema=${appearanceSchema}
							.computeLabel=${this._computeLabel}
							@value-changed=${this._valueChanged}
						></ha-form>
					</div>
				</ha-expansion-panel>

				<ha-expansion-panel outlined>
					<div slot="header" class="title">Categories</div>
					<div class="values">
						<ha-form
							.hass=${this.hass}
							.data=${this._config}
							.schema=${categorySchema}
							.computeLabel=${this._computeLabel}
							@value-changed=${this._valueChanged}
						></ha-form>
						${this.renderCategories()}
					</div>
				</ha-expansion-panel>

				<ha-expansion-panel outlined>
					<div slot="header" class="title">Actions</div>
					<div class="values">${this.renderActions()}</div>
				</ha-expansion-panel>

				<ha-expansion-panel outlined>
					<div slot="header" class="title">Entities</div>
					<div class="values">${this.renderEntities()}</div>
				</ha-expansion-panel>
			</div>
		`;
	}

	private renderEntities(): TemplateResult {
		const entities = this._config.entities || [];
		const entityIds = entities.map((e) => (typeof e === 'string' ? e : e.entity));

		return html`
			<ha-selector
				.hass=${this.hass}
				.selector=${{ entity: { multiple: true, domain: 'calendar' } }}
				.value=${entityIds}
				.label=${'Selected Calendars'}
				@value-changed=${this._entitiesChanged}
			></ha-selector>

			${entities.map((entity, index) => {
				const entityObj = typeof entity === 'string' ? { entity } : entity;
				return html`
					<ha-expansion-panel outlined style="margin-top: 8px;">
						<div slot="header">${entityObj.entity}</div>
						<div class="values">
							<ha-form
								.hass=${this.hass}
								.data=${entityObj}
								.schema=${entitySchema}
								.computeLabel=${(schema) => schema.label || schema.name}
								@value-changed=${(ev) => this._entityValueChanged(ev, index)}
							></ha-form>
							${this.renderEntityCategories(entityObj, index)}
						</div>
					</ha-expansion-panel>
				`;
			})}
		`;
	}

	private renderEntityCategories(entity: any, entityIndex: number): TemplateResult {
		const showCatIcon = entity?.showCategoryIcon;
		const showCatBar = entity?.showCategoryBar;
		if (!showCatIcon && !showCatBar) {
			return html``;
		}
		return html`
			<div class="secondary" style="margin-top: 8px; font-size: 12px;">Categories for this calendar</div>
			${Object.entries(DEFAULT_CATEGORY_MAP).map(([key, cfg]) => {
				const entityCfg = typeof entity === 'string' ? {} : entity.categoryMap?.[key];
				return html`
					<div class="row" style="gap: 8px; align-items: center;">
						<span class="secondary" style="font-size: 18px; width: 32px; text-align: center; min-width: 32px;"
							>${key}</span
						>
						<ha-form
							.hass=${this.hass}
							.data=${{ icon: entityCfg?.icon ?? cfg.icon, color: entityCfg?.color ?? cfg.color }}
							.schema=${entityCategorySchema}
							.computeLabel=${(schema: { label?: string; name: string }) => schema.label || schema.name}
							@value-changed=${(ev: CustomEvent) => this._entityCategoryValueChanged(entityIndex, key, ev)}
						></ha-form>
					</div>
				`;
			})}
		`;
	}

	private renderActions(): TemplateResult {
		const actions = ['tap_action', 'hold_action', 'double_tap_action'];
		return html`
			${actions.map(
				(action) => html`
					<div class="option" style="margin-bottom: 8px;">
						<ha-selector
							.hass=${this.hass}
							.selector=${{ ui_action: {} }}
							.value=${this._config[action]}
							.label=${action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
							@value-changed=${(ev) => this._actionValueChanged(ev, action)}
						></ha-selector>
					</div>
				`,
			)}
		`;
	}

	private renderCategories(): TemplateResult {
		return html`
			${Object.entries(DEFAULT_CATEGORY_MAP).map(
				([key, cfg]) => html`
					<div class="row" style="gap: 8px; align-items: center;">
						<span class="secondary" style="font-size: 18px; width: 32px; text-align: center; min-width: 32px;"
							>${key}</span
						>
						<ha-form
							.hass=${this.hass}
							.data=${{
								icon: this._config.categoryMap?.[key]?.icon ?? cfg.icon,
								color: this._config.categoryMap?.[key]?.color ?? cfg.color,
							}}
							.schema=${entityCategorySchema}
							.computeLabel=${(schema: { label?: string; name: string }) => schema.label || schema.name}
							@value-changed=${(ev: CustomEvent) => this._categoryValueChanged(key, ev)}
						></ha-form>
					</div>
				`,
			)}
		`;
	}

	private _computeLabel(schema: any) {
		return schema.label || schema.name;
	}

	private _getCleanConfig(config: atomicCardConfig): atomicCardConfig {
		const newConfig = { ...config };
		for (const [key, value] of Object.entries(newConfig)) {
			if (JSON.stringify(value) === JSON.stringify(defaults[key])) {
				delete newConfig[key];
			}
		}
		return newConfig;
	}

	private _valueChanged(ev: CustomEvent): void {
		const config = this._getCleanConfig(ev.detail.value);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		fireEvent(this, 'config-changed', { config });
	}

	private _actionValueChanged(ev: CustomEvent, action: string): void {
		this._config = { ...this._config, [action]: ev.detail.value };
		const config = this._getCleanConfig(this._config);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		fireEvent(this, 'config-changed', { config });
	}

	private _categoryValueChanged(key: string, ev: CustomEvent): void {
		const categoryMap = { ...(this._config.categoryMap ?? {}) };
		categoryMap[key] = { ...(categoryMap[key] ?? {}), ...ev.detail.value };
		this._config = { ...this._config, categoryMap };
		const config = this._getCleanConfig(this._config);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		fireEvent(this, 'config-changed', { config });
	}

	private _entitiesChanged(ev: CustomEvent): void {
		const newIds = ev.detail.value as string[];
		const currentEntities = this._config.entities || [];

		// Filter keep existing configs for selected IDs, add new ones for new IDs
		const newEntities = newIds.map((id) => {
			const existing = currentEntities.find((e) => (typeof e === 'string' ? e : e.entity) === id);
			return existing || { entity: id };
		});

		this._config = { ...this._config, entities: newEntities };
		const config = this._getCleanConfig(this._config);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		fireEvent(this, 'config-changed', { config });
	}

	private _entityValueChanged(ev: CustomEvent, index: number): void {
		const newEntityConfig = ev.detail.value;
		const entities = [...(this._config.entities || [])];
		entities[index] = newEntityConfig;
		this._config = { ...this._config, entities };
		const config = this._getCleanConfig(this._config);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		fireEvent(this, 'config-changed', { config });
	}

	private _entityCategoryValueChanged(entityIndex: number, key: string, ev: CustomEvent): void {
		const entities = [...(this._config.entities || [])];
		const entityObj =
			typeof entities[entityIndex] === 'string'
				? { entity: entities[entityIndex] as string }
				: { ...entities[entityIndex] };
		const categoryMap = { ...(entityObj.categoryMap ?? {}) };
		categoryMap[key] = { ...(categoryMap[key] ?? {}), ...ev.detail.value };
		entityObj.categoryMap = categoryMap;
		entities[entityIndex] = entityObj;
		this._config = { ...this._config, entities };
		const config = this._getCleanConfig(this._config);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		fireEvent(this, 'config-changed', { config });
	}
}
