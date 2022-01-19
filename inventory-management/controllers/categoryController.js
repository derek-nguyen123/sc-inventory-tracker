var Category = require('../models/category');
var Item = require('../models/item');
var mongoose = require('mongoose');
var async = require('async');
const { body, validationResult } = require('express-validator');

/* Retrieve and display a list of all categories */
exports.category_list = function(req, res, next) {
  Category.find({}, 'name')
  .collation({ locale: "en", caseLevel: true})
  .sort({name: 1})
  .exec(function (err, list_categories) {
    if (err) { return next(err); }
    res.render('category_list', {title: 'Categories' , category_list: list_categories});
  });
};

/* Retrieve and display all items of a category given an id */
exports.category_detail = function(req, res, next) {
  var id = mongoose.Types.ObjectId(req.params.id);
  async.parallel({
    category: function(callback) {
      Category.findById(id)
        .exec(callback);
    },
    category_items: function(callback) {
      Item.find({'category': id}, 'name brand category count')
        .populate('brand')
        .collation({ locale: "en", caseLevel: true})
        .sort({name: 1})
        .exec(callback);
    },
  }, function(err, results) {
    if (err) { return next(err); }
    if (results.category == null) {
      var err = new Error('Category not Found');
      err.status = 404;
      return next(err);
    }
    res.render('category_detail', {category: results.category, category_items: results.category_items});
  });
};

/* Render form to create a category */
exports.category_create_get = function(req, res, next) {
  res.render('category_form', {title: 'Create a category'});
};

/* Create a category given a category name */
exports.category_create_post = [
  body('name', 'Category name is required.').trim().isLength({ min: 1 }).escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    var category = new Category( { name: req.body.name } );
    if(!errors.isEmpty()) {
      res.render('category_form', {title: 'Create a category.', category: category, errors: errors.array()});
      return;
    } else {
      Category.findOne({ 'name': req.body.name })
        .exec(function(err, found){
          if(err) { return next(err); }
          if(found) {
            res.redirect(found.url);
          } else {
            category.save(function (err) {
              if (err) { return next(err); }
              res.redirect(category.url)
            });
          }
        });
    }
  }
];

/* Renders the update view with category name pre-loaded */
exports.category_update_get = function(req, res) {
  var id = mongoose.Types.ObjectId(req.params.id);
  Category.findById(id, function(err, category) {
    if (err) { return next(err); }
    if (category == null) {
      var err = new Error('Category not found.');
      err.status = 404;
      return next(err);
    }
    res.render('category_form', {title: 'Edit category', category: category});
  });
};

/* Edits an existed category given an id and new name */
exports.category_update_post = [
  body('name', 'Category name is required.').trim().isLength({ min: 1 }).escape(),
  (req, res, next) => {
    var id = mongoose.Types.ObjectId(req.params.id);
    const errors = validationResult(req);
    var category = new Category(
      {
        name: req.body.name,
        _id: id
      });
    if(!errors.isEmpty()) {
      res.render('category_form', {title: 'Edit category', category: category, errors: errors.array()});
      return;
    } else {
      Category.findByIdAndUpdate(id, category, {}, function (err, category_updated){
        if (err) { return next(err) }
        res.redirect(category_updated.url);
      });
    }
  }
];

/* Renders the delete an item view. Retrieves all items in a category to ensure no
  items of a category are deleted. */
exports.category_delete_get = function(req, res, next) {
  var id = mongoose.Types.ObjectId(req.params.id);
  async.parallel({
    category: function(callback) {
      Category.findById(id).exec(callback)
    },
    category_items: function(callback) {
      Item.find({ 'category': id}).exec(callback)
    },
  }, function(err, results) {
    if (err) { return next(err); }
    if (results.category==null) {
      res.redirect('/inventory/categorys')
    }
    res.render('category_delete', {title: 'Delete category', category: results.category, category_items: results.category_items});
  });
};

/* Deletes a category given an id, also given that there are no items associated with the category */
exports.category_delete_post = function(req, res, next) {
  var id = mongoose.Types.ObjectId(req.body.category_id);
  async.parallel({
    category: function(callback) {
      Category.findById(id).exec(callback)
    },
    category_items: function(callback) {
      Item.find({ 'category': id }).exec(callback)
    },
  }, function(err, results) {
    if (err) { return next(err); }
    if (results.category_items.length > 0) {
      res.render('category_delete', {title: 'Delete category', category: results.category, category_items: results.category_items});
      return;
    } else {
      Category.findByIdAndRemove(id, function deleteCategory(err) {
        if (err) { return next(err); }
        res.redirect('/inventory/categories');
      })
    }
  });
};
