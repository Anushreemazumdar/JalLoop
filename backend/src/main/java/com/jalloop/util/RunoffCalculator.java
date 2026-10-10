package com.jalloop.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class RunoffCalculator {
    private RunoffCalculator() {}

    public static BigDecimal theoreticalRunoffM3(BigDecimal rainfallMm, BigDecimal areaSqM, BigDecimal coefficient) {
        return rainfallMm.multiply(areaSqM).multiply(coefficient)
                .divide(BigDecimal.valueOf(1000), 4, RoundingMode.HALF_UP);
    }

    public static BigDecimal potentiallyCollectibleM3(BigDecimal runoffM3, BigDecimal efficiency) {
        return runoffM3.multiply(efficiency).setScale(4, RoundingMode.HALF_UP);
    }

    public static BigDecimal storageConstrainedM3(BigDecimal collectible, BigDecimal storageCapacityM3) {
        if (storageCapacityM3 == null) {
            return collectible;
        }
        return collectible.min(storageCapacityM3).setScale(4, RoundingMode.HALF_UP);
    }
}
