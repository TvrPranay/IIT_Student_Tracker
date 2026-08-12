import db, { initDb, run, query, get, exec } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = path.join(__dirname, 'database.db');

const syllabusData = {
  "Physics": {
    "11th": [
      { chapter: "Physical World & Measurement", topics: ["Units & dimensions", "significant figures", "dimensional analysis", "errors in measurement"] },
      { chapter: "Kinematics", topics: ["Motion in a straight line", "relative velocity", "motion in a plane", "projectile motion", "vectors (addition, dot/cross product)"] },
      { chapter: "Laws of Motion", topics: ["Newton's laws", "momentum", "friction (static/kinetic)", "circular motion", "banking of roads"] },
      { chapter: "Work, Energy and Power", topics: ["Work-energy theorem", "conservative/non-conservative forces", "potential & kinetic energy", "collisions (elastic/inelastic)"] },
      { chapter: "System of Particles & Rigid Body Motion", topics: ["Center of mass", "torque", "angular momentum", "moment of inertia", "rotational kinematics", "rolling motion"] },
      { chapter: "Gravitation", topics: ["Kepler's laws", "universal law of gravitation", "gravitational potential energy", "escape velocity", "orbital velocity", "satellites"] },
      { chapter: "Mechanical Properties of Solids", topics: ["Stress", "strain", "Hooke's law", "elastic moduli"] },
      { chapter: "Mechanical Properties of Fluids", topics: ["Pressure", "Pascal's law", "buoyancy", "viscosity", "surface tension", "Bernoulli's theorem"] },
      { chapter: "Thermal Properties of Matter", topics: ["Temperature scales", "thermal expansion", "calorimetry", "heat transfer (conduction, convection, radiation)"] },
      { chapter: "Thermodynamics", topics: ["Zeroth, first & second law", "isothermal/adiabatic processes", "heat engines", "refrigerators", "entropy"] },
      { chapter: "Kinetic Theory of Gases", topics: ["Ideal gas equation", "kinetic theory postulates", "degrees of freedom", "mean free path"] },
      { chapter: "Oscillations", topics: ["SHM", "spring-mass system", "simple pendulum", "damped & forced oscillations", "resonance"] },
      { chapter: "Waves", topics: ["Wave motion", "transverse/longitudinal waves", "speed of wave", "superposition", "standing waves", "beats", "Doppler effect"] }
    ],
    "12th": [
      { chapter: "Electrostatics", topics: ["Coulomb's law", "electric field", "Gauss's law", "electric potential", "capacitors", "dielectrics", "electric dipole"] },
      { chapter: "Current Electricity", topics: ["Ohm's law", "resistivity", "EMF", "Kirchhoff's laws", "Wheatstone bridge", "potentiometer", "drift velocity"] },
      { chapter: "Magnetic Effects of Current", topics: ["Biot-Savart law", "Ampere's law", "force on current-carrying conductor", "moving coil galvanometer", "cyclotron"] },
      { chapter: "Magnetism and Matter", topics: ["Bar magnet", "magnetic dipole", "earth's magnetism", "para/dia/ferromagnetism"] },
      { chapter: "Electromagnetic Induction", topics: ["Faraday's law", "Lenz's law", "self & mutual inductance", "eddy currents"] },
      { chapter: "Alternating Current", topics: ["AC circuits", "LCR circuits", "resonance", "transformers", "power in AC circuits"] },
      { chapter: "Electromagnetic Waves", topics: ["Displacement current", "EM spectrum", "properties of EM waves"] },
      { chapter: "Ray Optics", topics: ["Reflection", "refraction", "lenses", "mirrors", "total internal reflection", "optical instruments (microscope, telescope)", "prism"] },
      { chapter: "Wave Optics", topics: ["Huygens' principle", "interference", "Young's double slit experiment", "diffraction", "polarization"] },
      { chapter: "Dual Nature of Radiation and Matter", topics: ["Photoelectric effect", "Einstein's equation", "de Broglie wavelength"] },
      { chapter: "Atoms", topics: ["Bohr model", "atomic spectra", "hydrogen spectrum"] },
      { chapter: "Nuclei", topics: ["Nuclear structure", "radioactivity", "binding energy", "nuclear fission & fusion"] },
      { chapter: "Semiconductor Electronics", topics: ["p-n junction diode", "rectifiers", "transistors", "logic gates"] },
      { chapter: "Communication Systems", topics: ["Modulation", "amplitude/frequency modulation", "bandwidth", "propagation of signals"] }
    ]
  },
  "Chemistry": {
    "11th": [
      { chapter: "Some Basic Concepts of Chemistry", topics: ["Mole concept", "stoichiometry", "laws of chemical combination", "empirical/molecular formula"] },
      { chapter: "Structure of Atom", topics: ["Atomic models", "quantum numbers", "electronic configuration", "Aufbau principle", "Heisenberg's uncertainty"] },
      { chapter: "Classification of Elements & Periodicity", topics: ["Modern periodic law", "periodic trends (atomic radius, ionization energy, electronegativity)"] },
      { chapter: "Chemical Bonding & Molecular Structure", topics: ["Ionic/covalent bonding", "VSEPR theory", "hybridization", "MOT", "hydrogen bonding"] },
      { chapter: "States of Matter", topics: ["Gas laws", "ideal gas equation", "real gases", "van der Waals equation", "liquid state properties"] },
      { chapter: "Thermodynamics", topics: ["Enthalpy", "internal energy", "Hess's law", "entropy", "Gibbs free energy", "spontaneity"] },
      { chapter: "Equilibrium", topics: ["Chemical equilibrium", "Le Chatelier's principle", "ionic equilibrium", "pH", "buffer solutions", "solubility product"] },
      { chapter: "Redox Reactions", topics: ["Oxidation number", "balancing redox equations"] },
      { chapter: "Hydrogen", topics: ["Position in periodic table", "isotopes", "hydrides", "water", "hydrogen peroxide"] },
      { chapter: "s-Block Elements", topics: ["Alkali & alkaline earth metals", "properties", "compounds"] },
      { chapter: "p-Block Elements (Group 13 & 14)", topics: ["Boron family", "carbon family", "allotropes"] },
      { chapter: "Organic Chemistry: Basic Principles & Techniques", topics: ["Nomenclature", "isomerism", "reaction mechanisms (inductive, resonance)", "purification methods"] },
      { chapter: "Hydrocarbons", topics: ["Alkanes", "alkenes", "alkynes", "aromatic hydrocarbons", "benzene"] },
      { chapter: "Environmental Chemistry", topics: ["Pollution", "greenhouse effect", "ozone depletion"] }
    ],
    "12th": [
      { chapter: "Solid State", topics: ["Crystal lattices", "unit cells", "packing efficiency", "defects", "electrical/magnetic properties"] },
      { chapter: "Solutions", topics: ["Concentration terms", "Raoult's law", "colligative properties", "van't Hoff factor"] },
      { chapter: "Electrochemistry", topics: ["Electrochemical cells", "Nernst equation", "conductance", "Kohlrausch's law", "electrolysis", "batteries", "corrosion"] },
      { chapter: "Chemical Kinetics", topics: ["Rate of reaction", "order & molecularity", "rate law", "Arrhenius equation", "collision theory"] },
      { chapter: "Surface Chemistry", topics: ["Adsorption", "catalysis", "colloids", "emulsions"] },
      { chapter: "General Principles of Isolation of Elements", topics: ["Metallurgy", "extraction processes"] },
      { chapter: "p-Block Elements (Group 15–18)", topics: ["Nitrogen family", "oxygen family", "halogens", "noble gases"] },
      { chapter: "d and f Block Elements", topics: ["Transition elements", "lanthanides", "actinides", "properties"] },
      { chapter: "Coordination Compounds", topics: ["Werner's theory", "nomenclature", "isomerism", "bonding theories (VBT, CFT)"] },
      { chapter: "Haloalkanes & Haloarenes", topics: ["Nomenclature", "reactions", "mechanisms (SN1, SN2)"] },
      { chapter: "Alcohols, Phenols & Ethers", topics: ["Preparation", "properties", "reactions"] },
      { chapter: "Aldehydes, Ketones & Carboxylic Acids", topics: ["Nomenclature", "preparation", "reactions"] },
      { chapter: "Amines", topics: ["Classification", "preparation", "basicity", "reactions"] },
      { chapter: "Biomolecules", topics: ["Carbohydrates", "proteins", "enzymes", "vitamins", "nucleic acids"] },
      { chapter: "Polymers", topics: ["Classification", "types", "biodegradable polymers"] },
      { chapter: "Chemistry in Everyday Life", topics: ["Drugs", "food chemistry", "cleansing agents"] }
    ]
  },
  "Mathematics": {
    "11th": [
      { chapter: "Sets, Relations and Functions", topics: ["Set operations", "types of relations", "functions & their types"] },
      { chapter: "Complex Numbers and Quadratic Equations", topics: ["Algebra of complex numbers", "Argand plane", "quadratic equations"] },
      { chapter: "Matrices", topics: ["Types", "operations", "algebra"] },
      { chapter: "Determinants", topics: ["Properties", "applications", "solving linear equations"] },
      { chapter: "Permutations and Combinations", topics: ["Fundamental principle of counting", "factorial"] },
      { chapter: "Mathematical Induction", topics: ["Principle and applications"] },
      { chapter: "Binomial Theorem", topics: ["Expansion", "general term", "middle term"] },
      { chapter: "Sequences and Series", topics: ["AP", "GP", "HP", "special series"] },
      { chapter: "Limits and Continuity", topics: ["Basic limits", "standard limits"] },
      { chapter: "Trigonometry", topics: ["Trigonometric ratios", "identities", "equations", "inverse trig functions (intro)"] },
      { chapter: "Straight Lines", topics: ["Various forms", "angle between lines", "distance formulas"] },
      { chapter: "Conic Sections", topics: ["Circle", "parabola", "ellipse", "hyperbola"] },
      { chapter: "Introduction to 3D Geometry", topics: ["Coordinates", "distance formula"] },
      { chapter: "Statistics", topics: ["Measures of dispersion", "mean deviation", "variance", "standard deviation"] },
      { chapter: "Probability", topics: ["Basic probability", "addition & multiplication theorems"] },
      { chapter: "Mathematical Reasoning", topics: ["Statements", "logical connectives"] }
    ],
    "12th": [
      { chapter: "Relations and Functions", topics: ["Types of functions", "composition", "inverse functions"] },
      { chapter: "Inverse Trigonometric Functions", topics: ["Properties", "domain & range"] },
      { chapter: "Matrices", topics: ["Advanced operations", "inverse of matrix"] },
      { chapter: "Determinants", topics: ["Adjoint", "inverse", "applications", "area of triangle"] },
      { chapter: "Continuity and Differentiability", topics: ["Differentiability", "chain rule", "implicit differentiation", "logarithmic differentiation"] },
      { chapter: "Application of Derivatives", topics: ["Rate of change", "increasing/decreasing functions", "maxima & minima", "tangents & normals"] },
      { chapter: "Integrals", topics: ["Indefinite integrals", "methods of integration", "definite integrals", "properties"] },
      { chapter: "Application of Integrals", topics: ["Area under curves"] },
      { chapter: "Differential Equations", topics: ["Order & degree", "formation", "solving (variable separable, linear)"] },
      { chapter: "Vector Algebra", topics: ["Vector operations", "dot & cross product", "scalar triple product"] },
      { chapter: "Three Dimensional Geometry", topics: ["Direction cosines", "lines & planes in 3D", "angle between lines/planes"] },
      { chapter: "Linear Programming", topics: ["Formulation", "graphical solution"] },
      { chapter: "Probability", topics: ["Conditional probability", "Bayes' theorem", "random variables", "probability distributions", "Binomial distribution"] }
    ]
  }
};

const seed = async () => {
  try {
    console.log('Dropping old tables for fresh seed...');
    await exec(`
      DROP TABLE IF EXISTS test_results;
      DROP TABLE IF EXISTS test_assignments;
      DROP TABLE IF EXISTS weekly_tests;
      DROP TABLE IF EXISTS parent_uploads;
      DROP TABLE IF EXISTS daily_logs;
      DROP TABLE IF EXISTS student_topic_progress;
      DROP TABLE IF EXISTS syllabus_topics;
      DROP TABLE IF EXISTS syllabus_chapters;
      DROP TABLE IF EXISTS parent_student_links;
      DROP TABLE IF EXISTS student_profiles;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS subjects;
    `);

    console.log('Initializing database schema before seeding...');
    await initDb();

    console.log('Seeding subjects...');
    for (const subjectName of Object.keys(syllabusData)) {
      await run('INSERT OR IGNORE INTO subjects (name) VALUES (?)', [subjectName]);
    }

    console.log('Seeding chapters and topics...');
    for (const [subjectName, classes] of Object.entries(syllabusData)) {
      const subjectRow = await get('SELECT id FROM subjects WHERE name = ?', [subjectName]);
      const subjectId = subjectRow.id;

      for (const [classLevel, chapters] of Object.entries(classes)) {
        let chapterOrder = 1;
        for (const chap of chapters) {
          const insertChapter = await run(
            'INSERT INTO syllabus_chapters (subject_id, class_level, chapter_name, chapter_order, student_id) VALUES (?, ?, ?, ?, NULL)',
            [subjectId, classLevel, chap.chapter, chapterOrder]
          );
          const chapterId = insertChapter.id;

          let topicOrder = 1;
          for (const topicName of chap.topics) {
            await run(
              'INSERT INTO syllabus_topics (chapter_id, topic_name, topic_order, student_id) VALUES (?, ?, ?, NULL)',
              [chapterId, topicName.trim(), topicOrder]
            );
            topicOrder++;
          }
          chapterOrder++;
        }
      }
    }

    console.log('MPC Seeding successfully completed!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
