type PostalMeta = {
  labelDE: string;
  labelEN: string;
  hintDE: string;
  hintEN: string;
};

const DEFAULT: PostalMeta = {
  labelDE: "Postleitzahl",
  labelEN: "Postal Code",
  hintDE: "z.B. 1234",
  hintEN: "e.g. 1234",
};

const POSTAL_META: Record<string, PostalMeta> = {
  Deutschland:            { labelDE: "PLZ",               labelEN: "PLZ",          hintDE: "z.B. 241",   hintEN: "e.g. 241"   },
  Germany:               { labelDE: "PLZ",               labelEN: "PLZ",          hintDE: "z.B. 241",   hintEN: "e.g. 241"   },
  Österreich:            { labelDE: "PLZ",               labelEN: "PLZ",          hintDE: "z.B. 10",    hintEN: "e.g. 10"    },
  Austria:               { labelDE: "PLZ",               labelEN: "PLZ",          hintDE: "z.B. 10",    hintEN: "e.g. 10"    },
  Schweiz:               { labelDE: "PLZ",               labelEN: "PLZ",          hintDE: "z.B. 80",    hintEN: "e.g. 80"    },
  Switzerland:           { labelDE: "PLZ",               labelEN: "PLZ",          hintDE: "z.B. 80",    hintEN: "e.g. 80"    },
  Frankreich:            { labelDE: "Code postal",       labelEN: "Code postal",  hintDE: "z.B. 750",   hintEN: "e.g. 750"   },
  France:                { labelDE: "Code postal",       labelEN: "Code postal",  hintDE: "z.B. 750",   hintEN: "e.g. 750"   },
  Spanien:               { labelDE: "Código postal",     labelEN: "Código postal",hintDE: "z.B. 280",   hintEN: "e.g. 280"   },
  Spain:                 { labelDE: "Código postal",     labelEN: "Código postal",hintDE: "z.B. 280",   hintEN: "e.g. 280"   },
  Italien:               { labelDE: "CAP",               labelEN: "CAP",          hintDE: "z.B. 001",   hintEN: "e.g. 001"   },
  Italy:                 { labelDE: "CAP",               labelEN: "CAP",          hintDE: "z.B. 001",   hintEN: "e.g. 001"   },
  Niederlande:           { labelDE: "Postcode",          labelEN: "Postcode",     hintDE: "z.B. 1012",  hintEN: "e.g. 1012"  },
  Netherlands:           { labelDE: "Postcode",          labelEN: "Postcode",     hintDE: "z.B. 1012",  hintEN: "e.g. 1012"  },
  Belgien:               { labelDE: "Postleitzahl",      labelEN: "Postal Code",  hintDE: "z.B. 10",    hintEN: "e.g. 10"    },
  Belgium:               { labelDE: "Postleitzahl",      labelEN: "Postal Code",  hintDE: "z.B. 10",    hintEN: "e.g. 10"    },
  "Vereinigtes Königreich": { labelDE: "Postcode",       labelEN: "Postcode",     hintDE: "z.B. SW1",   hintEN: "e.g. SW1"   },
  "United Kingdom":      { labelDE: "Postcode",          labelEN: "Postcode",     hintDE: "z.B. SW1",   hintEN: "e.g. SW1"   },
  Schweden:              { labelDE: "Postnummer",        labelEN: "Postnummer",   hintDE: "z.B. 111",   hintEN: "e.g. 111"   },
  Sweden:                { labelDE: "Postnummer",        labelEN: "Postnummer",   hintDE: "z.B. 111",   hintEN: "e.g. 111"   },
  Norwegen:              { labelDE: "Postnummer",        labelEN: "Postnummer",   hintDE: "z.B. 01",    hintEN: "e.g. 01"    },
  Norway:                { labelDE: "Postnummer",        labelEN: "Postnummer",   hintDE: "z.B. 01",    hintEN: "e.g. 01"    },
  Dänemark:              { labelDE: "Postnummer",        labelEN: "Postnummer",   hintDE: "z.B. 21",    hintEN: "e.g. 21"    },
  Denmark:               { labelDE: "Postnummer",        labelEN: "Postnummer",   hintDE: "z.B. 21",    hintEN: "e.g. 21"    },
  Finnland:              { labelDE: "Postinumero",       labelEN: "Postinumero",  hintDE: "z.B. 001",   hintEN: "e.g. 001"   },
  Finland:               { labelDE: "Postinumero",       labelEN: "Postinumero",  hintDE: "z.B. 001",   hintEN: "e.g. 001"   },
  Polen:                 { labelDE: "Kod pocztowy",      labelEN: "Postal Code",  hintDE: "z.B. 00",    hintEN: "e.g. 00"    },
  Poland:                { labelDE: "Kod pocztowy",      labelEN: "Postal Code",  hintDE: "z.B. 00",    hintEN: "e.g. 00"    },
  Tschechien:            { labelDE: "PSČ",               labelEN: "Postal Code",  hintDE: "z.B. 110",   hintEN: "e.g. 110"   },
  "Czech Republic":      { labelDE: "PSČ",               labelEN: "Postal Code",  hintDE: "z.B. 110",   hintEN: "e.g. 110"   },
  Ungarn:                { labelDE: "Irányítószám",      labelEN: "Postal Code",  hintDE: "z.B. 10",    hintEN: "e.g. 10"    },
  Hungary:               { labelDE: "Irányítószám",      labelEN: "Postal Code",  hintDE: "z.B. 10",    hintEN: "e.g. 10"    },
  Portugal:              { labelDE: "Código postal",     labelEN: "Postal Code",  hintDE: "z.B. 1000",  hintEN: "e.g. 1000"  },
  Luxemburg:             { labelDE: "Postleitzahl",      labelEN: "Postal Code",  hintDE: "z.B. L-1",   hintEN: "e.g. L-1"   },
  Luxembourg:            { labelDE: "Postleitzahl",      labelEN: "Postal Code",  hintDE: "z.B. L-1",   hintEN: "e.g. L-1"   },
  "Vereinigte Staaten":  { labelDE: "ZIP Code",          labelEN: "ZIP Code",     hintDE: "z.B. 100",   hintEN: "e.g. 100"   },
  "United States":       { labelDE: "ZIP Code",          labelEN: "ZIP Code",     hintDE: "z.B. 100",   hintEN: "e.g. 100"   },
  USA:                   { labelDE: "ZIP Code",          labelEN: "ZIP Code",     hintDE: "z.B. 100",   hintEN: "e.g. 100"   },
  Kanada:                { labelDE: "Postal Code",       labelEN: "Postal Code",  hintDE: "z.B. M5V",   hintEN: "e.g. M5V"   },
  Canada:                { labelDE: "Postal Code",       labelEN: "Postal Code",  hintDE: "z.B. M5V",   hintEN: "e.g. M5V"   },
  Australien:            { labelDE: "Postcode",          labelEN: "Postcode",     hintDE: "z.B. 20",    hintEN: "e.g. 20"    },
  Australia:             { labelDE: "Postcode",          labelEN: "Postcode",     hintDE: "z.B. 20",    hintEN: "e.g. 20"    },
  Neuseeland:            { labelDE: "Postcode",          labelEN: "Postcode",     hintDE: "z.B. 10",    hintEN: "e.g. 10"    },
  "New Zealand":         { labelDE: "Postcode",          labelEN: "Postcode",     hintDE: "z.B. 10",    hintEN: "e.g. 10"    },
  Japan:                 { labelDE: "〒 Postleitzahl",   labelEN: "Postal Code",  hintDE: "z.B. 100",   hintEN: "e.g. 100"   },
  Südkorea:              { labelDE: "Postleitzahl",      labelEN: "Postal Code",  hintDE: "z.B. 035",   hintEN: "e.g. 035"   },
  "South Korea":         { labelDE: "Postleitzahl",      labelEN: "Postal Code",  hintDE: "z.B. 035",   hintEN: "e.g. 035"   },
};

export function getPostalMeta(country: string): PostalMeta {
  return POSTAL_META[country] ?? DEFAULT;
}

export function getPostalLabel(country: string, showEnglish: boolean): string {
  const meta = getPostalMeta(country);
  return showEnglish ? meta.labelEN : meta.labelDE;
}

export function getPostalHint(country: string, showEnglish: boolean): string {
  const meta = getPostalMeta(country);
  return showEnglish ? meta.hintEN : meta.hintDE;
}
