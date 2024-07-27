import defaultProps from "./helper/common";
import DraggableAttribute from "./DraggableAttribute";
import Dropdown from "./Dropdown";
import Pivottable from "./Pivottable";
import TableRenderer from "./TableRenderer";
import PlotlyRenderer from "./PlotlyRenderer";
import { PivotData, getSort, sortAs, aggregators } from "./helper/utils";
import draggable from "vuedraggable";
export default {
  name: "vue-pivottable-ui",
  mixins: [defaultProps],
  model: {
    prop: "config",
    event: "onRefresh",
  },
  props: {
    async: {
      type: Boolean,
      default: false
    },
    pivotFilters: {
      type: Object,
      default: function() {
        return [];
      },
    },
    setFilter: {
      type: Number,
      default: 0,
    },
    hiddenAttributes: {
      type: Array,
      default: function() {
        return [];
      },
    },
    hiddenFromAggregators: {
      type: Array,
      default: function() {
        return [];
      },
    },
    hiddenFromDragDrop: {
      type: Array,
      default: function() {
        return [];
      },
    },
    sortonlyFromDragDrop: {
      type: Array,
      default: function() {
        return [];
      },
    },
    disabledFromDragDrop: {
      type: Array,
      default: function() {
        return [];
      },
    },
    rowLimit: {
      type: Number,
      default: 0,
    },
    colLimit: {
      type: Number,
      default: 0,
    },
    menuLimit: {
      type: Number,
      default: 500,
    },
    config: {
      type: Object,
      default: function() {
        return {};
      },
    },
  },
  computed: {
    appliedFilter() {
      return this.propsData.valueFilter;
    },
    rendererItems() {
      return this.renderers || Object.assign({}, TableRenderer, PlotlyRenderer);
    },
    aggregatorItems() {
      return this.aggregators || aggregators;
    },
    numValsAllowed() {
      return (
        this.aggregatorItems[this.propsData.aggregatorName]([])().numInputs || 0
      );
    },
    rowAttrs() {
      return this.propsData.rows.filter(
        (e) =>
          !this.hiddenAttributes.includes(e) &&
          !this.hiddenFromDragDrop.includes(e)
      );
    },
    colAttrs() {
      return this.propsData.cols.filter(
        (e) =>
          !this.hiddenAttributes.includes(e) &&
          !this.hiddenFromDragDrop.includes(e)
      );
    },
    unusedAttrs() {
      return this.propsData.attributes
        .filter(
          (e) =>
            !this.propsData.rows.includes(e) &&
            !this.propsData.cols.includes(e) &&
            !this.hiddenAttributes.includes(e) &&
            !this.hiddenFromDragDrop.includes(e)
        )
        .sort(sortAs(this.unusedOrder));
    },
  },
  data() {
    return {
      propsData: {
        aggregatorName: "",
        rendererName: "",
        rowOrder: "key_a_to_z",
        colOrder: "key_a_to_z",
        vals: [],
        cols: [],
        rows: [],
        attributes: [],
        valueFilter: {},
        renderer: null,
      },
      pivotData: [],
      openStatus: {},
      attrValues: {},
      unusedOrder: [],
      zIndices: {},
      maxZIndex: 1000,
      openDropdown: false,
      materializedInput: [],
      sortIcons: {
        key_a_to_z: {
          rowSymbol: "↕",
          colSymbol: "↔",
          next: "value_a_to_z",
        },
        value_a_to_z: {
          rowSymbol: "↓",
          colSymbol: "→",
          next: "value_z_to_a",
        },
        value_z_to_a: {
          rowSymbol: "↑",
          colSymbol: "←",
          next: "key_a_to_z",
        },
      },
    };
  },
  beforeUpdated(nextProps) {
    this.materializeInput(nextProps.data);
  },

  created() {
  //   this.$root.$on("setValueFilter", ($event) => {
  //     // console.log('teste')
  //     Object.keys($event).forEach((filter) => {
  //       let count = 0;
  //       count = Object.keys($event[filter]).length;
  //       if (count > 0) {
  //         let fields = $event[filter];
  //         this.updateValueFilter({ attribute: filter, valueFilter: fields });
  //       }
  //     });
  //     //for(let attr in $event) {
  //     // console.log($event[attr])
  //     // for(let field in attr) {
  //     // console.log(attr[field])
  //     // if (attr[field] === true) {
  //     // console.log(field)
  //     // }
  //     // }
  //     //}
  //     // this.updateValueFilter()
  //   });
    this.$root.$on("setRowOrder", ($event) => {
      this.propsData.rowOrder = $event
      this.propUpdater("rowOrder")(
        this.sortIcons[this.propsData.rowOrder].next
        );
    })

    this.$root.$on("setColOrder", ($event) => {
      this.propsData.colOrder = $event
      this.propUpdater("colOrder")(
        this.sortIcons[this.propsData.colOrder].next
        );
    })
  },

  watch: {
    // sorters: {
    //   handler (value) {
    //     console.log(value)
    //   }
    // },
    // setFilter: {
    //   immediate: true,
    //   deep: true,
    //   handler (val) {
    //     console.log(val)
    //     Object.keys(this.pivotFilters).forEach((filter) => {
    //       let count = 0
    //       count = Object.keys(this.pivotFilters[filter]).length
    //       if(count > 0) {
    //         let fields = this.pivotFilters[filter]

    //         this.updateValueFilter({attribute: filter, valueFilter: fields})
    //       }
    //     })
    //   }
    // },
    cols: {
      handler(value) {
        this.propsData.cols = value;
      },
    },
    rows: {
      handler(value) {
        this.propsData.rows = value;
      },
    },
    rendererName: {
      handler(value) {
        this.propsData.rendererName = value;
      },
    },
    appliedFilter: {
      // handler (value, oldValue) {
      handler(value) {
        this.$emit("update:valueFilter", value);
      },
      immediate: true,
      deep: true,
    },
    valueFilter: {
      handler(value) {
        this.propsData.valueFilter = value;
      },
      immediate: true,
      deep: true,
    },
    data: {
      // handler (value) {
      handler() {
        this.init();
        Object.keys(this.pivotFilters).forEach((filter) => {
          let count = 0;
          count = Object.keys(this.pivotFilters[filter]).length;
          if (count > 0) {
            let fields = this.pivotFilters[filter];
            this.updateValueFilter({ attribute: filter, valueFilter: fields });
          }
        });
      },
      immediate: true,
      deep: true,
    },
    attributes: {
      handler(value) {
        this.propsData.attributes =
          value.length > 0 ? value : Object.keys(this.attrValues);
      },
      deep: true,
    },
    propsData: {
      handler(value) {
        if (this.pivotData.length === 0) return;
        const props = {
          derivedAttributes: this.derivedAttributes,
          hiddenAttributes: this.hiddenAttributes,
          hiddenFromAggregators: this.hiddenFromAggregators,
          hiddenFromDragDrop: this.hiddenFromDragDrop,
          sortonlyFromDragDrop: this.sortonlyFromDragDrop,
          disabledFromDragDrop: this.disabledFromDragDrop,
          menuLimit: this.menuLimit,
          rowLimit: this.rowLimit,
          colLimit: this.colLimit,
          attributes: value.attributes,
          unusedAttrs: this.unusedAttrs,
          sorters: this.sorters,
          data: this.materializedInput,
          rowOrder: value.rowOrder,
          colOrder: value.colOrder,
          valueFilter: value.valueFilter,
          rows: value.rows,
          cols: value.cols,
          rendererName: value.rendererName,
          aggregatorName: value.aggregatorName,
          aggregators: this.aggregatorItems,
          vals: value.vals
        }

        this.$emit('onRefresh', props)
      },
      immediate: false,
      deep: true,
    },
  },
  methods: {
    init() {
      this.materializeInput(this.data);
      this.propsData.vals = this.vals.slice();
      this.propsData.rows = this.rows;
      this.propsData.cols = this.cols;
      this.propsData.rowOrder = this.rowOrder;
      this.propsData.colOrder = this.colOrder;
      this.propsData.rendererName = this.rendererName;
      this.propsData.aggregatorName = this.aggregatorName;
      this.propsData.sorters = this.sorters;
      this.propsData.attributes =
        this.attributes.length > 0
          ? this.attributes
          : Object.keys(this.attrValues);
      this.unusedOrder = this.unusedAttrs;

       Object.keys(this.attrValues).forEach(key => {
        let valueFilter = {}
        const values = this.valueFilter && this.valueFilter[key]
        if (values && Object.keys(values).length) {
          valueFilter = this.valueFilter[key]
        }
        this.updateValueFilter({
          attribute: key,
          valueFilter
        })
      })
    },
    assignValue(field) {
      this.$set(this.propsData.valueFilter, field, {});
    },
    propUpdater(key) {
      return (value) => {
        this.propsData[key] = value;
      };
    },
    updateValueFilter({ attribute, valueFilter }) {
      this.$set(this.propsData.valueFilter, attribute, valueFilter);
      this.$root.$emit("getValueFilter", this.propsData.valueFilter);
    },
    moveFilterBoxToTop({ attribute }) {
      this.maxZIndex += 1;
      this.zIndices[attribute] = this.maxZIndex + 1;
    },
    openFilterBox({ attribute, open }) {
      this.openStatus[attribute] = open;
    },
    // closeFilterBox (event) {
    closeFilterBox() {
      this.openStatus = {};
    },
    materializeInput(nextData) {
      if (this.pivotData === nextData) {
        return;
      }
      this.pivotData = nextData;
      const attrValues = {};
      const materializedInput = [];
      let recordsProcessed = 0;
      PivotData.forEachRecord(this.pivotData, this.derivedAttributes, function(
        record
      ) {
        materializedInput.push(record);
        for (const attr of Object.keys(record)) {
          if (!(attr in attrValues)) {
            attrValues[attr] = {};
            if (recordsProcessed > 0) {
              attrValues[attr].null = recordsProcessed;
            }
          }
        }
        for (const attr in attrValues) {
          const value = attr in record ? record[attr] : "null";
          if (!(value in attrValues[attr])) {
            attrValues[attr][value] = 0;
          }
          attrValues[attr][value]++;
        }
        recordsProcessed++;
      });
      this.materializedInput = materializedInput;
      this.attrValues = attrValues;
    },
    makeDnDCell(items, onChange, classes, h) {
      const scopedSlots = this.$scopedSlots.pvtAttr;
      return h(
        draggable,
        {
          attrs: {
            draggable: "li[data-id]",
            group: "sharted",
            ghostClass: ".pvtPlaceholder",
            filter: ".pvtFilterBox",
            preventOnFilter: false,
            tag: "td",
          },
          props: {
            value: items,
          },
          staticClass: classes,
          on: {
            sort: onChange.bind(this),
          },
        },
        [
          items.map((x) => {
            return h(DraggableAttribute, {
              [scopedSlots ? "scopedSlots" : undefined]: {
                pvtAttr: (props) => h("slot", scopedSlots(props)),
              },
              props: {
                sortable:
                  this.sortonlyFromDragDrop.includes(x) ||
                  !this.disabledFromDragDrop.includes(x),
                draggable:
                  !this.sortonlyFromDragDrop.includes(x) &&
                  !this.disabledFromDragDrop.includes(x),
                name: x,
                key: x,
                attrValues: this.attrValues[x],
                sorter: getSort(this.sorters, x),
                menuLimit: this.menuLimit,
                zIndex: this.zIndices[x] || this.maxZIndex,
                valueFilter: this.propsData.valueFilter[x],
                open: this.openStatus[x],
                async: this.async,
                unused: this.unusedAttrs.includes(x),
                localeStrings: this.locales[this.locale].localeStrings
              },
              domProps: {},
              on: {
                "update:filter": this.updateValueFilter,
                "moveToTop:filterbox": this.moveFilterBoxToTop,
                "open:filterbox": this.openFilterBox,
              },
            });
          }),
        ]
      );
    },
    rendererCell(rendererName, h) {
      return this.$slots.rendererCell
        ? h(
            "td",
            {
              staticClass: ["pvtRenderers pvtVals pvtText"],
            },
            this.$slots.rendererCell
          )
        : h(
            "td",
            {
              staticClass: ["pvtRenderers"],
            },
            [
              h(Dropdown, {
                props: {
                  values: Object.keys(this.rendererItems),
                  value: rendererName
                },
                on: {
                  input: (value) => {
                    this.propUpdater("rendererName")(value);
                    this.propUpdater(
                      "renderer",
                      this.rendererItems[this.rendererName]
                    );
                    this.$root.$emit("getView", value);
                  },
                },
              }),
            ]
          );
    },
    aggregatorCell(aggregatorName, vals, h) {
      return this.$slots.aggregatorCell
        ? h(
            "td",
            {
              staticClass: ["pvtVals pvtText"],
            },
            this.$slots.aggregatorCell
          )
        : h(
            "td",
            {
              staticClass: ["pvtVals"],
            },
            [
              h("div", [
                h(Dropdown, {
                  style: {
                    display: "inline-block",
                  },
                  props: {
                    values: Object.keys(this.aggregatorItems),
                    value: aggregatorName
                  },
                  domProps: {
                    value: aggregatorName,
                  },
                  on: {
                    input: (value) => {
                      this.$root.$emit("changeVal", value);
                      this.propUpdater("aggregatorName")(value);
                    },
                  },
                }),
                h(
                  "a",
                  {
                    staticClass: ["pvtRowOrder"],
                    attrs: {
                      role: "button",
                    },
                    on: {
                      click: () => {
                        this.propUpdater("rowOrder")(
                          this.sortIcons[this.propsData.rowOrder].next
                          );
                          this.$root.$emit("changeRowOrder", this.rowOrder)
                      },
                    },
                  },
                  this.sortIcons[this.propsData.rowOrder].rowSymbol
                ),
                h(
                  "a",
                  {
                    staticClass: ["pvtColOrder"],
                    attrs: {
                      role: "button",
                    },
                    on: {
                      click: () => {
                        this.propUpdater("colOrder")(
                          this.sortIcons[this.propsData.colOrder].next
                          );
                          this.$root.$emit("changeColOrder", this.colOrder)
                      },
                    },
                  },
                  this.sortIcons[this.propsData.colOrder].colSymbol
                ),
              ]),
              this.numValsAllowed > 0
                ? new Array(this.numValsAllowed).fill().map((n, i) => [
                    h(Dropdown, {
                      props: {
                        values: Object.keys(this.attrValues).filter(
                          (e) =>
                            !this.hiddenAttributes.includes(e) &&
                            !this.hiddenFromAggregators.includes(e)
                        ),
                      },
                      domProps: {
                        value: vals[i],
                      },
                      on: {
                        input: (value) => {
                          this.propsData.vals.splice(i, 1, value);
                          this.$root.$emit("getVals", [i, value]);
                        },
                      },
                    }),
                  ])
                : undefined,
            ]
          );
    },
    outputCell(props, isPlotlyRenderer, h) {
      return h(
        "td",
        {
          staticClass: ["pvtOutput"],
        },
        [
          isPlotlyRenderer
            ? h(PlotlyRenderer[props.rendererName], {
                props,
              })
            : h(Pivottable, {
                props: {
                  ...props,
                  tableMaxWidth: this.tableMaxWidth,
                },
              }),
        ]
      );
    },
  },
  render(h) {
    const outputScopedSlot = this.$scopedSlots.output;
    const outputSlot = this.$slots.output;
    const rendererName = this.propsData.rendererName;
    const aggregatorName = this.propsData.aggregatorName;
    const vals = this.propsData.vals;
    const props = {
      ...this.$props,
      localeStrings: this.localeStrings,
      data: this.materializedInput,
      rowOrder: this.propsData.rowOrder,
      colOrder: this.propsData.colOrder,
      valueFilter: this.propsData.valueFilter,
      rows: this.propsData.rows,
      cols: this.propsData.cols,
      aggregators: this.aggregatorItems,
      rendererName,
      aggregatorName,
      vals,
    };
    let pivotData = null;
    try {
      pivotData = new PivotData(props);
    } catch (error) {
      // eslint-disable-next-line no-console
      if (console && console.error(error.stack)) {
        return this.computeError(h);
      }
    }
    const limitOver =
      outputScopedSlot &&
      this.colLimit > 0 &&
      this.rowLimit > 0 &&
      (pivotData.getColKeys().length > this.colLimit ||
        pivotData.getRowKeys().length > this.rowLimit);
    const outputCell = this.outputCell(
      props,
      rendererName.indexOf("Chart") > -1,
      h
    );
    return h(
      "table",
      {
        staticClass: ["pvtUi"],
      },
      [
        h(
          "tbody",
          {
            on: {
              click: this.closeFilterBox,
            },
          },
          [
            h("tr", [
              outputSlot
                ? h("td", { staticClass: "pvtOutput" }, outputSlot)
                : limitOver
                ? h(
                    "td",
                    { staticClass: "pvtOutput" },
                    outputScopedSlot({ pivotData: new PivotData(props) })
                  )
                : outputCell,
            ]),
          ]
        ),
      ]
    );
  },
  // renderError (h, error) {
  renderError(h) {
    return this.uiRenderError(h);
  },
};
