package com.jalloop.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class RunoffCalculatorTest {
    @Test
    void theoreticalRunoffMatchesDocumentedExample() {
        BigDecimal runoff = RunoffCalculator.theoreticalRunoffM3(
                new BigDecimal("20"), new BigDecimal("1000"), new BigDecimal("0.8"));
        assertThat(runoff).isEqualByComparingTo("16.0000");
    }

    @Test
    void collectionEfficiencyAppliedOnceThenStorageCaps() {
        BigDecimal runoff = new BigDecimal("16.0000");
        BigDecimal collectible = RunoffCalculator.potentiallyCollectibleM3(runoff, new BigDecimal("0.8"));
        assertThat(collectible).isEqualByComparingTo("12.8000");
        BigDecimal constrained = RunoffCalculator.storageConstrainedM3(collectible, new BigDecimal("10"));
        assertThat(constrained).isEqualByComparingTo("10.0000");
        assertThat(constrained).isNotEqualByComparingTo(runoff);
    }
}
