var mongoose = require('mongoose');
const { DateTime } = require("luxon");
var Schema = mongoose.Schema;

// Associate items with a brand and categories via their objectIds
var ItemSchema = new Schema({
  name: { type: String, required: true },
  brand: { type: Schema.Types.ObjectId, ref: 'BrandModel', required: true },
  category: [{type: Schema.Types.ObjectId, ref: 'CategoryModel'}],
  updated: { type: Date, default: Date.now() },
  count: { type: Number, default: 0, min: [0, 'Count cannot be negative!'] },
});

ItemSchema
  .virtual('url')
  .get(function() {
    return '/inventory/item/' + this._id;
  });

ItemSchema
  .virtual('updated_formatted')
  .get(function() {
    return DateTime.fromJSDate(this.updated).toLocaleString(DateTime.DATE_MED);
  });

module.exports = mongoose.model('ItemModel', ItemSchema);