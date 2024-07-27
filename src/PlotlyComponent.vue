<template>
  <div ref="plotly" :id="id" style="width: 100%; height: 100%"></div>
</template>

<script>
import Plotly from "../../plotly.js-basic-dist";

export default {
  name: "PlotlyComponent",
  props: {
    data: {
      type: Array,
      required: true,
    },
    layout: {
      type: Object,
      default: () => ({}),
    },
    id: {
      type: String,
      default: "plotly-graph",
    },
    cspnonce: {
      type: String,
      required: true,
    },
  },
  mounted() {
    this.renderPlot();
  },
  methods: {
    renderPlot() {
      if (this.type === "pie") {
        for (const element of this.data) {
          for (
            let labelCount = 0;
            labelCount < element.labels.length;
            labelCount++
          ) {
            element.labels[labelCount] = this.limitLegend(
              element.labels[labelCount],
              15
            );
          }
        }
      } else if (this.data.length > 1) {
          if (
            this.data[0]?.orientation === "h" ||
            this.data[0]?.mode === "markers"
          ) {
            for (const element of this.data) {
              element.name = this.limitLegend(
                element.name,
                15
              );
              for (
                let yCount = 0;
                yCount < element.y.length;
                yCount++
              ) {
                element.y[yCount] = this.limitLegend(
                  element.y[yCount],
                  15
                );
              }
            }
          } else {
            this.data.forEach((d) => {
              d.name = this.limitLegend(d.name, 15);
            });
          }
        }
      Plotly.newPlot(this.$refs.plotly, this.data, this.layout, {
        responsive: true,
        cspNonce: this.cspnonce,
      });
    },

    limitLegend(name, maxLength) {
      if (name.length > maxLength) {
        return name.substring(0, maxLength) + "...";
      } else {
        return name;
      }
    },
  },
  watch: {
    data: {
      deep: true,
      handler() {
        this.renderPlot();
      },
    },
    layout: {
      deep: true,
      handler() {
        this.renderPlot();
      },
    },
  },
};
</script>