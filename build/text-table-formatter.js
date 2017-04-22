'use strict';

/* eslint-env node */

function padValue(value, columnWidth, padChar, alignChar, partsWidths) {
   let nameResult = value;

   if (alignChar) {
      const leftWidth = value.indexOf(alignChar);
      nameResult = '';
      for (let paddingSpace = leftWidth; paddingSpace < partsWidths.left; paddingSpace++) {
         nameResult += padChar || ' ';
      }
      nameResult += value;
      for (let paddingSpace = nameResult.length; paddingSpace < columnWidth; paddingSpace++) {
         nameResult += padChar || ' ';
      }
   } else {
      for (let paddingSpace = value.length; paddingSpace < columnWidth; paddingSpace++) {
         nameResult += padChar || ' ';
      }
   }

   return nameResult;
}

function formatTable(tableData, options) {
   const columns = options.columns;

   const allWidths = tableData.reduce((widths, entry) => {
      columns.forEach((colDesc) => {
         const value = entry[colDesc.name].toString() + (colDesc.units || '');

         if (colDesc.alignChar) {
            const leftWidth = value.indexOf(colDesc.alignChar);
            const rightWidth = value.length - leftWidth;

            widths[colDesc.name] = widths[colDesc.name] || { left: 0, right: 0 };
            widths[colDesc.name] = {
               left: Math.max(leftWidth, widths[colDesc.name].left),
               right: Math.max(rightWidth, widths[colDesc.name].right)
            };
         } else {
            widths[colDesc.name] = Math.max(widths[colDesc.name] || 0, value.length);
         }
      });
      return widths;
   }, {});

   const totalWidths = {};

   columns.forEach((colDesc) => {
      const width = allWidths[colDesc.name];
      if (typeof width === 'object') {
         totalWidths[colDesc.name] = width.left + width.right;
      } else {
         totalWidths[colDesc.name] = width;
      }
   });

   const top = [];
   const bottom = [];

   columns.forEach((colDesc) => {
      top.push(padValue('', totalWidths[colDesc.name], '─'));
      bottom.push(padValue('', totalWidths[colDesc.name], '─'));
   });

   const rows = tableData.map((entry) => {
      const rowValue = [];
      columns.forEach((colDesc) => {
         const value = entry[colDesc.name].toString() + (colDesc.units || '');
         rowValue.push(padValue(value, totalWidths[colDesc.name], ' ', colDesc.alignChar, allWidths[colDesc.name]));
      });
      return rowValue;
   });

   let table = '┌─' + top.join('─┬─') + '─┐\n';
   rows.forEach((row) => {
      table += '│ ' + row.join(' │ ') + ' │\n';
   });
   table += '└─' + bottom.join('─┴─') + '─┘\n';

   return table;
}

module.exports = formatTable;
