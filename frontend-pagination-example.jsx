import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Grid, Pagination, Card, Image, Text, Button, Box, Loader } from '@mantine/core';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const limit = 12; // Products per page
  
  useEffect(() => {
    fetchProducts();
  }, [currentPage]);
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://stile-backend.vercel.app/allproducts?page=${currentPage}&limit=${limit}`);
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
      setTotalProducts(response.data.totalProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  return (
    <Container size="xl" py={40}>
      <Text size="xl" weight={700} mb={30}>
        All Products ({totalProducts})
      </Text>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
          <Loader size="xl" />
        </Box>
      ) : (
        <>
          <Grid>
            {products.map((product) => (
              <Grid.Col key={product._id} xs={12} sm={6} md={4} lg={3}>
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Card.Section>
                    <Image
                      src={product.images[0]}
                      height={200}
                      fit="cover"
                      alt={product.name}
                    />
                  </Card.Section>
                  
                  <Text weight={500} size="lg" mt="md">
                    {product.name}
                  </Text>
                  
                  <Text size="sm" color="dimmed">
                    ₹{product.price}
                  </Text>
                  
                  <Button variant="filled" fullWidth mt="md" radius="md">
                    View Details
                  </Button>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              radius="md"
              size="lg"
            />
          </Box>
        </>
      )}
    </Container>
  );
};

export default ProductsPage; 