CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    operator VARCHAR(50) NOT NULL,
    inflow DECIMAL(10,2),
    outflow DECIMAL(10,2),
    inflow_cod DECIMAL(10,2),
    inflow_nh3n DECIMAL(10,2),
    inflow_tp DECIMAL(10,2),
    inflow_tn DECIMAL(10,2),
    outflow_cod DECIMAL(10,2),
    outflow_nh3n DECIMAL(10,2),
    outflow_tp DECIMAL(10,2),
    outflow_tn DECIMAL(10,2),
    water_quality_issues TEXT,
    equipment_status TEXT,
    equipment_issues TEXT,
    carbon_source DECIMAL(10,2),
    phosphate_removal DECIMAL(10,2),
    disinfectant DECIMAL(10,2),
    chemical_effects TEXT,
    sludge_production DECIMAL(10,2),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;