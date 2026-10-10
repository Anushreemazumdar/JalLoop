package com.jalloop.entity;

import com.jalloop.enums.ContaminationFlag;
import com.jalloop.enums.SurfaceType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "catchments")
public class Catchment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal areaSqM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private SurfaceType surfaceType;

    @Column(nullable = false, precision = 4, scale = 3)
    private BigDecimal runoffCoefficient;

    @Column(precision = 12, scale = 2)
    private BigDecimal storageCapacityM3;

    @Column(nullable = false, precision = 4, scale = 3)
    private BigDecimal collectionEfficiency;

    @Column(length = 240)
    private String proposedUse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ContaminationFlag contaminationFlag;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(nullable = false)
    private boolean syntheticDemo;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getAreaSqM() { return areaSqM; }
    public void setAreaSqM(BigDecimal areaSqM) { this.areaSqM = areaSqM; }
    public SurfaceType getSurfaceType() { return surfaceType; }
    public void setSurfaceType(SurfaceType surfaceType) { this.surfaceType = surfaceType; }
    public BigDecimal getRunoffCoefficient() { return runoffCoefficient; }
    public void setRunoffCoefficient(BigDecimal runoffCoefficient) { this.runoffCoefficient = runoffCoefficient; }
    public BigDecimal getStorageCapacityM3() { return storageCapacityM3; }
    public void setStorageCapacityM3(BigDecimal storageCapacityM3) { this.storageCapacityM3 = storageCapacityM3; }
    public BigDecimal getCollectionEfficiency() { return collectionEfficiency; }
    public void setCollectionEfficiency(BigDecimal collectionEfficiency) { this.collectionEfficiency = collectionEfficiency; }
    public String getProposedUse() { return proposedUse; }
    public void setProposedUse(String proposedUse) { this.proposedUse = proposedUse; }
    public ContaminationFlag getContaminationFlag() { return contaminationFlag; }
    public void setContaminationFlag(ContaminationFlag contaminationFlag) { this.contaminationFlag = contaminationFlag; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public boolean isSyntheticDemo() { return syntheticDemo; }
    public void setSyntheticDemo(boolean syntheticDemo) { this.syntheticDemo = syntheticDemo; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
