const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
// find all products
  // be sure to include its associated Category and Tag data
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Category }, 
        { model: Tag, through: ProductTag },
      ],
    });

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
// find a single product by its `id`
  // be sure to include its associated Category and Tag data
router.get('/:id', async (req, res) => {
  try{
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category }, 
        { model: Tag, through: ProductTag },
      ],
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product
router.post('/', async(req, res) => {
  try{
    const newProduct = await Product.create(req.body);

    // Check if there are any associated tags to create pairings in the ProductTag model
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: newProduct.id,
          tag_id,
        };
      });
      return ProductTag.bulkCreate(productTagIdArr);
    }
 // if no product tags, just respond
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json(err);
  }
});

// update product
router.put('/:id', async (req, res) => {
  try {
    // Update product data
    const [affectedRows] = await Product.update(req.body, {
      where: {
        id: req.params.id,
      },
    });

    if (affectedRows === 0) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Check and update associated tags if provided
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTags = await ProductTag.findAll({
        where: { product_id: req.params.id },
      });

      const productTagIds = productTags.map(({ tag_id }) => tag_id);

      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });

      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    }

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // Delete a product by its `id`
    const deletedProduct = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (deletedProduct === 0) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(400).json(err);
  }
});


module.exports = router;
