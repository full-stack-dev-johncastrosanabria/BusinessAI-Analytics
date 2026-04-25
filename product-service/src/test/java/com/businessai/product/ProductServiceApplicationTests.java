package com.businessai.product;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Basic integration test to verify the Product Service application context loads successfully.
 */
@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:mysql://localhost:3306/businessai_analytics_test?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true",
    "spring.jpa.hibernate.ddl-auto=none"
})
class ProductServiceApplicationTests {

    @Test
    void contextLoads() {
        // This test verifies that the Spring application context loads successfully
    }
}
