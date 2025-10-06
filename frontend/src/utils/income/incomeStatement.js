// Types: "line" (editable), "sum" (computed), "group" (container)
export const IS = {
  groups: [
    {
      id: "operatingIncome",
      label: "Operating Income",
      type: "group",
      children: [
        {
          id: "grossScheduledRent",
          label: "Gross Scheduled Rent",
          type: "line",
          role: "anchor",
        },
        {
          id: "adjustments",
          label: "Adjustments & Allowances",
          type: "group",
          sign: -1,
          children: [
            {
              id: "vacancyLoss",
              label: "Vacancy / Collection Loss",
              type: "line",
              forceNegative: true,
            },
            {
              id: "freeRent",
              label: "Less - Free Rent and/or Allowances",
              type: "line",
              sign: -1,
            },
            {
              id: "otherAdj",
              label: "Less - Other Adjustments",
              type: "line",
              sign: -1,
            },
          ],
        },
        {
          id: "netRentalIncome",
          label: "Net Rental Income",
          type: "sum",
          formula: (ctx) =>
            sum(ctx, ["grossScheduledRent"]) +
            sumGroup(ctx, "adjustments") /* adjustments are negative */,
        },

        {
          id: "additionalIncome",
          label: "Additional Income",
          type: "group",
          sign: +1,
          children: [
            {
              id: "recoverableIncome",
              label: "Recoverable Income",
              type: "line",
            },
            { id: "otherIncome", label: "Other Income", type: "line" },
          ],
        },

        // Rename: Effective Gross Income = old Total Operating Income
        {
          id: "effectiveGrossIncome",
          label: "Effective Gross Income",
          type: "sum",
          formula: (ctx) =>
            ctx.node("netRentalIncome") + sumGroup(ctx, "additionalIncome"),
        },
      ],
    },

    // Operating Expenses (kept separate)
    {
      id: "operatingExpenses",
      label: "Operating Expenses",
      type: "group",
      children: [
        {
          id: "taxes",
          label: "Taxes",
          type: "group",
          children: [
            /* lines */
          ],
        },
        {
          id: "insurance",
          label: "Insurance",
          type: "group",
          children: [
            /* lines */
          ],
        },
        {
          id: "cam",
          label: "Common Area (CAM)",
          type: "group",
          children: [
            /* lines */
          ],
        },
        {
          id: "admin",
          label: "Administrative",
          type: "group",
          children: [
            /* lines */
          ],
        },
        {
          id: "totalOperatingExpenses",
          label: "Total Operating Expenses",
          type: "sum",
          formula: (ctx) =>
            sumGroup(ctx, "operatingExpenses", {
              exclude: ["totalOperatingExpenses"],
            }),
        },
      ],
    },
  ],
};

const sum = (ctx, ids) => ids.reduce((s, id) => s + ctx.value(id), 0);
const sumGroup = (ctx, groupId, opts = {}) =>
  ctx.children(groupId, opts).reduce((s, id) => s + ctx.value(id), 0);
