var Item = require('../models/item');
var Category = require('../models/category');
var Brand = require('../models/brand');
var mongoose = require('mongoose');
var async = require('async');
const { body, validationResult } = require('express-validator');

/* Retrieves and displays all items on home page */
exports.index = function(req, res, next) {
  Item.find({}, 'name brand count')
  .collation({ locale: "en", caseLevel: true})
  .sort({name : 1})
  .populate('brand')
  .exec(function (err, list_items) {
    if (err) { return next(err); }
    else {
      res.render('index', {title: 'Inventory', item_list: list_items });
    }
  });
};

/* Retrieve and display details of a specific item given an id.
  Displays brand, related categories, and stock */
exports.item_detail = function(req, res, next) {
  var id = mongoose.Types.ObjectId(req.params.id);
    async.parallel({
    item: function(callback) {
      Item.findById(id)
        .populate('brand')
        .populate('category')
        .exec(callback);
    },
  }, function(err, results) {
    if (err) { return next(err); }
    if (results.item == null) {
      var err = new Error('Item not Found');
      err.status = 404;
      return next(err);
    }
    res.render('item_detail', {item: results.item});
  });
};

/* Renders the form to create an item. Retrieves all brands and categories to select */
exports.item_create_get = function(req, res,  next) {
  async.parallel({
    brands: function(callback) {
      Brand.find(callback);
    },
    categories: function(callback) {
      Category.find(callback);
    }
  }, function(err, results) {
    if (err) { return next(err); }
    res.render('item_form', {title: 'Create an item', brands: results.brands, categories: results.categories});
  });
};

/* Creates item given categories, brand, count, and item name. */
exports.item_create_post = [
  (req, res, next) => {
    // Ensures category is an array from the given checkboxes
    if(!(req.body.category instanceof Array)){
        if(typeof req.body.category ==='undefined')
        req.body.category = [];
        else
        req.body.category = new Array(req.body.category);
    }
    next();
  },
  body('name', 'Name must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('brand', 'Brand must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('count', 'Count must not be empty.').trim().isInt({ min: 0 }).withMessage('Must be a positive integer.').toInt().escape(),
  body('category.*').escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    var item = new Item(
      {
        name: req.body.name,
        brand: req.body.brand,
        count: req.body.count,
        category: req.body.category
      });
    if (!errors.isEmpty()) {
      async.parallel({
        brands: function(callback) {
          Brand.find(callback);
        },
        categories: function(callback) {
          Category.find(callback);
        },
      }, function(err, results) {
        if (err) { return next(err); }
        for (let index = 0; index < results.categories.length; index++) {
          if (item.category.indexOf(results.categories[index]._id) > -1) {
            results.categories[index].checked = 'true';
          }
        }
        res.render('item_form', {title: 'Create an item', brands: results.brands, categories:results.categories, item: item, errors: errors.array()});
      });
      return;
    } else {
      item.save(function (err) {
        if (err) { return next(err); }
          res.redirect(item.url);
      });
    }
  }
];

/* Renders form to edit an item, pre-loads all existing data for the item given an id */
exports.item_update_get = function(req, res, next) {
  var id = mongoose.Types.ObjectId(req.params.id);
  async.parallel({
    item: function(callback) {
      Item.findById(id)
        .populate('brand')
        .populate('category')
        .exec(callback);
    },
    brands: function(callback) {
      Brand.find(callback);
    },
    categories: function(callback) {
      Category.find(callback);
    },
  }, function(err, results) {
    if (err) {return next(err); }
    if (results.item==null) {
      var err = new Error('Item not found');
      err.status = 404;
      return next(err);
    }
    // Iterates through all categories to find categories to display as checked/unchecked
    for (var c1 = 0; c1 < results.categories.length; c1++) {
      for (var c2 = 0; c2 < results.item.category.length; c2++) {
        if (results.categories[c1]._id.toString()===results.item.category[c2]._id.toString()) {
          results.categories[c1].checked='true';
        }
      }
    }
    res.render('item_form', {title: 'Edit Item', item: results.item, brands: results.brands, categories: results.categories});
  })
};

/* Edits an item given a new information. Renders the item's detail page after */
exports.item_update_post = [
  (req, res, next) => {
    if(!(req.body.category instanceof Array)){
        if(typeof req.body.category ==='undefined')
        req.body.category = [];
        else
        req.body.category = new Array(req.body.category);
    }
    next();
  },
  body('name', 'Name must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('brand', 'Brand must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('count', 'Count must not be empty.').trim().isInt({ min: 0 }).withMessage('Must be a positive integer.').toInt().escape(),
  body('category.*').escape(),
  (req, res, next) => {
    var id = mongoose.Types.ObjectId(req.params.id);
    const errors = validationResult(req);
    var item = new Item(
      {
        name: req.body.name,
        brand: req.body.brand,
        count: req.body.count,
        category: (typeof req.body.category==='undefined') ? [] : req.body.category,
        _id:id
      });
    if (!errors.isEmpty()) {
      async.parallel({
        brands: function(callback) {
          Brand.find(callback);
        },
        categories: function(callback) {
          Category.find(callback);
        },
      }, function(err, results) {
        if (err) { return next(err); }
        for (let index = 0; index < results.categories.length; index++) {
          if (item.category.indexOf(results.categories[index]._id) > -1) {
            results.categories[index].checked = 'true';
          }
        }
        res.render('item_form', {title: 'Edit item', brands: results.brands, categories:results.categories, item: item, errors: errors.array()});
      });
      return;
    } else {
      Item.findByIdAndUpdate(id, item, {}, function(err, item_updated){
        if (err) {return next(err); }
          res.redirect(item_updated.url);
      });
    }
  }
];

/* Renders the deletion screen for an item given an id */
exports.item_delete_get = function(req, res, next) {
  var id = mongoose.Types.ObjectId(req.params.id);
  async.parallel({
    item: function(callback) {
      Item.findById(id).exec(callback)
    },
  }, function(err, results) {
    if (err) { return next(err); }
    if (results.item==null) {
      res.redirect('/inventory/items')
    }
    res.render('item_delete', {title: 'Delete item', item: results.item});
  });
};

/* Deletes an item given an id */
exports.item_delete_post = function(req, res, next) {
  var id = mongoose.Types.ObjectId(req.body.item_id);
  async.parallel({
    category: function(callback) {
      Item.findById(id).exec(callback)
    },
  }, function(err, results) {
    if (err) { return next(err); }
    Item.findByIdAndRemove(id, function deleteItem(err) {
      if (err) { return next(err); }
      res.redirect('/inventory/');
    });
  });
};
