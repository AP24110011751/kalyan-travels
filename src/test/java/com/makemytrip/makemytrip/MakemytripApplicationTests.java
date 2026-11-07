package com.makemytrip.makemytrip;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Disabled in CI/CD build environments without live MongoDB")
class MakemytripApplicationTests {

	@Test
	void contextLoads() {
	}

}
