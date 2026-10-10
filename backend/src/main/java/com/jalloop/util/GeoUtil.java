package com.jalloop.util;

import java.math.BigDecimal;

public final class GeoUtil {
    private GeoUtil() {}

    public static void validateCoordinates(BigDecimal lat, BigDecimal lon) {
        if (lat == null || lon == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }
        if (lat.compareTo(BigDecimal.valueOf(-90)) < 0 || lat.compareTo(BigDecimal.valueOf(90)) > 0) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (lon.compareTo(BigDecimal.valueOf(-180)) < 0 || lon.compareTo(BigDecimal.valueOf(180)) > 0) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
    }

    public static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371000d;
        double p1 = Math.toRadians(lat1);
        double p2 = Math.toRadians(lat2);
        double dp = Math.toRadians(lat2 - lat1);
        double dl = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dp / 2) * Math.sin(dp / 2)
                + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
        return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
