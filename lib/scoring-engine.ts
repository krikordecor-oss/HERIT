interface DiagnosticData {
  buildingType: string;
  constructionYear: string;
  wallType: string;
  isolation: string;
  exposure: string;
  solarProtection: string;
}

export function calculateThermalScore(data: DiagnosticData): number {
  let score = 0;

  // Base score adjustments based on building type
  if (data.buildingType === 'maison_individuelle') score += 5;
  if (data.buildingType === 'maison_mitoyenne') score += 3;
  if (data.buildingType === 'appartement') score += 0; // Generally less vulnerable
  if (data.buildingType === 'immeuble_collectif') score += 2;
  if (data.buildingType === 'batiment_commercial') score += 10;
  if (data.buildingType === 'batiment_agricole') score += 15;

  // Construction Year
  if (data.constructionYear === 'avant_1948') score += 20;
  if (data.constructionYear === '1948_1975') score += 15;
  if (data.constructionYear === '1975_2000') score += 10;
  if (data.constructionYear === 'apres_2000') score += 5;

  // Wall Type
  if (data.wallType === 'pierre_de_taille') score += 15;
  if (data.wallType === 'brique') score += 10;
  if (data.wallType === 'beton_parpaing') score += 12;
  if (data.wallType === 'beton_cellulaire') score += 8;
  if (data.wallType === 'bois_ossature') score += 5;
  if (data.wallType === 'pan_de_bois') score += 18;
  if (data.wallType === 'materiau_biosource') score += 3;
  if (data.wallType === 'je_ne_sais_pas_mur') score += 10;

  // Isolation
  if (data.isolation === 'aucune') score += 25;
  if (data.isolation === 'partielle') score += 15;
  if (data.isolation === 'complete') score += 5;
  if (data.isolation === 'recente') score += 0;
  if (data.isolation === 'je_ne_sais_pas_isolation') score += 15;

  // Exposure
  if (data.exposure === 'sud') score += 10; // More sun exposure can mean more heat gain
  if (data.exposure === 'ouest') score += 8;
  if (data.exposure === 'est') score += 5;
  if (data.exposure === 'nord') score += 2;

  // Solar Protection
  if (data.solarProtection === 'aucune_protection') score += 10;
  if (data.solarProtection === 'volets') score += 3;
  if (data.solarProtection === 'stores_exterieurs') score += 2;
  if (data.solarProtection === 'vegetation_arbres') score += 1;

  // Apply specific rules
  // Murs en pierre + avant 1948 + aucune isolation + exposition sud + aucune protection = score élevé 75-85
  if (
    data.wallType === 'pierre_de_taille' &&
    data.constructionYear === 'avant_1948' &&
    data.isolation === 'aucune' &&
    data.exposure === 'sud' &&
    data.solarProtection === 'aucune_protection'
  ) {
    score = Math.min(100, score + 20); // Add a significant boost, cap at 100
  }

  // Murs béton + 1948-1975 + isolation partielle = score modéré 45-60
  if (
    data.wallType === 'beton_parpaing' &&
    data.constructionYear === '1948_1975' &&
    data.isolation === 'partielle'
  ) {
    score = Math.min(100, score + 10); // Adjust to be in modéré range
  }

  // Murs bois + après 2000 + isolation complète récente = score faible 10-25
  if (
    data.wallType === 'bois_ossature' &&
    data.constructionYear === 'apres_2000' &&
    data.isolation === 'recente'
  ) {
    score = Math.max(0, score - 15); // Adjust to be in faible range
  }

  // Béton cellulaire + isolation partielle = score modéré 40-55
  if (
    data.wallType === 'beton_cellulaire' &&
    data.isolation === 'partielle'
  ) {
    score = Math.min(100, score + 8); // Adjust to be in modéré range
  }

  // Pan de bois + avant 1948 + aucune isolation = score critique 80-95
  if (
    data.wallType === 'pan_de_bois' &&
    data.constructionYear === 'avant_1948' &&
    data.isolation === 'aucune'
  ) {
    score = Math.min(100, score + 25); // Push to critical
  }

  // Matériau biosourcé + isolation complète récente = score faible 5-20
  if (
    data.wallType === 'materiau_biosource' &&
    data.isolation === 'recente'
  ) {
    score = Math.max(0, score - 10); // Push to faible
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}
