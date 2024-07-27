import VuePivottable from './Pivottable'
import VuePivottableUi from './PivottableUi'
import TableRenderer from './TableRenderer'
import VuePivottablePreview from './PivottablePreview'

import {
  aggregatorTemplates,
  aggregators,
  derivers,
  locales,
  naturalSort,
  numberFormat,
  getSort,
  sortAs,
  PivotData,
} from "./helper/utils";

const PivotUtilities = {
  aggregatorTemplates,
  aggregators,
  derivers,
  locales,
  naturalSort,
  numberFormat,
  getSort,
  sortAs,
  PivotData,
};

const Renderer = {
  TableRenderer
}

const components = {
  VuePivottable,
  VuePivottableUi,
  VuePivottablePreview,
};

if (typeof window !== "undefined" && window.Vue) window.Vue.use(VuePivottable);

export {
  VuePivottable,
  VuePivottableUi,
  VuePivottablePreview,
  PivotUtilities,
  Renderer,
};

export default (Vue) => {
  for (const key in components) {
    Vue.component(components[key].name, components[key]);
  }
};
