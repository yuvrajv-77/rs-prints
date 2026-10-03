import { vendureClient } from "../client";
import { graphql } from "../generated/gql";

/**
 * GraphQL Query: Get all active products with basic variant pricing.
 * Used for listing pages, search indexes, and static path generation.
 */
export const GET_PRODUCTS = graphql(`
  query GetProducts {
    products {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
        variants {
          id
          name
          price
          priceWithTax
        }
      }
    }
  }
`);

/**
 * GraphQL Query: Fetch full product details by URL slug.
 * Retrieves all gallery assets, option groups, and variants with their option combinations.
 */
export const GET_PRODUCT_BY_SLUG = graphql(`
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      featuredAsset {
        id
        preview
      }
      assets {
        id
        preview
        name
      }
      variants {
        id
        name
        sku
        price
        priceWithTax
        currencyCode
        stockLevel
        featuredAsset {
          id
          preview
        }
        options {
          id
          code
          name
          group {
            id
            code
            name
          }
        }
      }
      optionGroups {
        id
        code
        name
        options {
          id
          code
          name
        }
      }
      collections {
        id
        name
        slug
        breadcrumbs {
          id
          name
          slug
        }
        parent {
          id
          name
          slug
        }
        featuredAsset {
          id
          preview
        }
      }
    }
  }
`);

/** Fetches a simple list of products from the Shop API */
export async function getProducts() {
  const data = await vendureClient.request(GET_PRODUCTS);
  return data.products.items;
}

/** Fetches full product entity by its slug for detail page rendering */
export async function getProductBySlug(slug: string) {
  const data = await vendureClient.request(GET_PRODUCT_BY_SLUG, { slug });
  return data.product;
}

/**
 * GraphQL Query: Complete catalog snapshot.
 * Fetches all collections (hierarchical categories), products, and facet filters
 * in a single round-trip to build categorized shop pages.
 */
export const GET_VENDURE_CATALOGUE = graphql(`
  query GetVendureCatalogue {
    collections {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
        parent {
          id
          name
          slug
        }
        children {
          id
          name
          slug
          description
        }
      }
    }
    products {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
        assets {
          id
          preview
          name
        }
        variants {
          id
          name
          price
          priceWithTax
        }
        collections {
          id
          name
          slug
          parent {
            id
            name
            slug
          }
        }
        facetValues {
          id
          name
          code
          facet {
            id
            name
            code
          }
        }
      }
    }
    facets {
      items {
        id
        name
        code
        values {
          id
          name
          code
        }
      }
    }
  }
`);

/**
 * Groups all products into hierarchical categories & subcategories based on Vendure collections.
 * 
 * Logic:
 * 1. Identifies top-level parent collections (those attached to __root_collection__ or id=1).
 * 2. Groups child subcollections under their respective parent.
 * 3. Associates products matching each collection's id or slug.
 * 4. Catches unassigned products and places them under an "Other Products" fallback section.
 */
export async function getVendureGroupedSections() {
  const data = await vendureClient.request(GET_VENDURE_CATALOGUE);
  const allCollections = data.collections.items;
  const allProducts = data.products.items;
  const allFacets = data.facets.items;

  const { mapVendureProductToStorefrontProduct } = await import("../mappers");

  // Top-level collections are those whose parent is __root_collection__ (or id === '1')
  const topLevel = allCollections.filter(
    (c) => !c.parent || c.parent.name === "__root_collection__" || c.parent.id === "1"
  );

  const sections = topLevel.map((parentCol) => {
    // Child subcollections for this parent
    const children = allCollections.filter(
      (c) => c.parent && String(c.parent.id) === String(parentCol.id)
    );

    const subcategoryDefs =
      children.length > 0
        ? children
        : [parentCol];

    const subcategories = subcategoryDefs.map((sub) => {
      const matchingProducts = allProducts.filter((p) =>
        p.collections.some(
          (c) => String(c.id) === String(sub.id) || c.slug === sub.slug
        )
      );

      return {
        id: sub.slug,
        title: sub.name,
        description: sub.description || `${sub.name} printing collection.`,
        products: matchingProducts.map(mapVendureProductToStorefrontProduct),
      };
    });

    const parentProducts = subcategories.flatMap((s) => s.products);

    return {
      id: parentCol.slug,
      title: parentCol.name,
      description: parentCol.description || `Explore our custom ${parentCol.name.toLowerCase()} range.`,
      totalCount: parentProducts.length,
      products: parentProducts,
      subcategories,
    };
  });

  // Handle any products not assigned to top-level collections
  const assignedProductIds = new Set(
    sections.flatMap((s) => s.products.map((p) => p.id))
  );
  const unassigned = allProducts
    .filter((p) => !assignedProductIds.has(p.id))
    .map(mapVendureProductToStorefrontProduct);

  if (unassigned.length > 0) {
    sections.push({
      id: "other-products",
      title: "Other Products",
      description: "Additional custom printed products available in our shop.",
      totalCount: unassigned.length,
      products: unassigned,
      subcategories: [
        {
          id: "general",
          title: "All Products",
          description: "Assorted merchandise and custom items.",
          products: unassigned,
        },
      ],
    });
  }

  return {
    groupedSections: sections,
    facets: allFacets,
    totalProducts: allProducts.length,
  };
}