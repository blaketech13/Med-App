export const GROUPS = ['Cardiovascular','Respiratory, Allergy & Anaphylaxis','Analgesia & Local Anaesthesia','Sedation, Seizures & Behavioural','Metabolic & Endocrine','Nausea & Vomiting','Toxicology & Overdose','Trauma, Haemorrhage & Fluids','Obstetrics','Antimicrobial'];
export const SHORT = {'Cardiovascular':'Cardiovascular','Respiratory, Allergy & Anaphylaxis':'Resp & Anaphylaxis','Analgesia & Local Anaesthesia':'Analgesia','Sedation, Seizures & Behavioural':'Sedation & Seizures','Metabolic & Endocrine':'Metabolic','Nausea & Vomiting':'Nausea','Toxicology & Overdose':'Toxicology','Trauma, Haemorrhage & Fluids':'Trauma & Fluids','Obstetrics':'Obstetrics','Antimicrobial':'Antimicrobial'};

let _drugs = null;
export function getDrugs(){
  if(_drugs) return _drugs;
    const R = [
      ['Adrenaline','1mg/1ml','Respiratory, Allergy & Anaphylaxis','Cardiovascular','Nil',[
        'Severe / Life-threatening Asthma|IM|0.5mg|0.5 ml (1:1,000)|N/A|5 mins, no max',
        'Anaphylaxis|IM|0.5mg|0.5ml (1:1000)|N/A|5 mins, no max',
        'Anaphylaxis (Airway Obstruction / Stridor / Angioedema post x2 IM doses)|NEB|5mg|5ml (1:1000)|N/A|Single dose (CSPSOC consult for repeats)',
        'Anaphylaxis / Peri Arrest (refractory to x2 doses IM adrenaline & fluid)|IV/IO|10mcg|0.1ml (1:10,000)|Add 9mls NaCl|1 min as required (if not effective post 2 doses call CSPSOC for higher dose)',
        'Cardiac Arrest|IV/IO|1mg|1ml (1:1000)|N/A|3-5 min (every 2nd loop)',
        'Post ROSC|IV/IO|50mcg|0.5ml (1:10,000)|Add 9mls NaCl to make 1mg/10ml|Every 3-5 min as required to maintain systolic BP > 100mmHg (post 2 x 250mL NaCl boluses)',
        'Severe Croup|NEB|5mg|5ml (1:1000)|N/A|Repeat 5mg after 15 mins if required'
      ]],
      ['Amiodarone','150mg/3ml','Cardiovascular','','Nil in Cardiac Arrest',[
        'Cardiac Arrest with persistent / shock-resistant VF / pulseless VT post 3rd shock|IV/IO|300mg|6mls|N/A|Repeat dose 150mg in 3 ml may be administered after 5th shock'
      ]],
      ['Aspirin','300mg Tablet','Cardiovascular','','Known hypersensitivity to aspirin / salicylates / NSAIDs~< 16 years old',[
        'Patients with suspected Acute Coronary Syndromes.|PO|300mg|1 Tablet|N/A|Single Dose'
      ]],
      ['Atropine','1.2mg/1ml','Cardiovascular','Toxicology & Overdose','Known hypersensitivity~Patients with cardiac transplant',[
        'Symptomatic Bradycardia: haemodynamically unstable associated with poor signs of perfusion, including; Hypotension, Altered GCS, Diaphoresis, SOB and/or cyanosis, syncope|IV/IO|0.6mg|0.5mls|Given neat|Every 3-5 min titrated to effect (max 3mg)',
        'Organophosphate poisoning|IV/IO|1-2mg|10-20mls|Dilute 1.2mg/1ml with 11mls NaCl to make 1.2mg/12mL (100mcg/ml)|Repeat every 5 mins until atropinisation evident'
      ]],
      ['Cefazolin','2g','Antimicrobial','Trauma, Haemorrhage & Fluids','Immediate / severe hypersensitivity to Penicillin~Closed fractures that do not meet other indication~Isolated open fracture of the distal phalanx',[
        'Antibiotic prophylaxis for:~open fractures~significant wounds that are grossly contaminated and cannot be cleaned|IV|2g|Reconstitute (2g of powder) with 19mls of NaCl 0.9%|Final product 100mg/ml~Push slowly over 3-5 mins|Single Dose'
      ]],
      ['Cophenylcaine','Lignocaine 5mg & Phenylephrine 0.5mg/spray','Analgesia & Local Anaesthesia','','Hypersensitivity to Phenylephrine, Lidocaine or other anaesthetics~Pregnancy',[
        'Local pain: abrasions, small cuts and wounds~mild-moderate epistaxis~post tonsillectomy haemorrhage~Intra-oral haemorrhage|IN|10 sprays (5 per nostril)|1 spray at a time|N/A|Max 10 sprays (5/nostril)',
        '|PO / Topical|5 sprays|||Max 5 sprays'
      ]],
      ['Droperidol','10mg/2ml','Sedation, Seizures & Behavioural','',"Known allergy~Known Parkinson's Disease~Where Ketamine has been administered to sedate this episode~Post-ictal Disturbed & Abnormal Behaviour~< 6 years old~Patients known or suspected to be pregnant",[
        'Disturbed and Abnormal Behaviour (RASS 1-3) where risk to safety is evident and de-escalation ineffective.~Dementia & frail patients where Olanzapine cannot be administered or is ineffective.|IM|< 70 years old: 5 mg in moderate/severe alcohol intoxication.~10mg in nil to mild alcohol intoxication.~> 70 years old: 2.5mg in moderate to severe alcohol intoxication.~5mg in nil to mild alcohol intoxication.|0.5-1.0ml|N/A|Repeat as necessary each 15 mins to max cumulative dose 20mg/24hrs (via all routes).',
        '|IV/IO|< 70 years old: 2.5-5 mg titrated to effect~> 70 years old or frail: 2.5 mg|2.5-5.0mls|Dilute 10mg/2mls with 8mls of NaCl to make 1mg/ml|'
      ]],
      ['Fentanyl (IN)','450mcg/1.5ml IN','Analgesia & Local Anaesthesia','','Hypersensitivity to Fentanyl~Occluded nasal passages or epistaxis',[
        'Moderate to severe pain~Acute Coronary Syndromes where GTN has been ineffective|IN|Small / elderly / frail - 90mcg|2 x 0.15ml (90mcg)|Must prime atomiser before first dose with 0.1mL|45mcg (1 x 0.15 ml) after 5-10 mins',
        '||180mcg|3 x 0.2ml (180mcg)||60mcg (1 x 0.2ml) after 5-10 mins'
      ]],
      ['Fentanyl Citrate (IV)','100mcg/2ml IV','Analgesia & Local Anaesthesia','','Hypersensitivity to Fentanyl~< 1 year old',[
        'Moderate to severe pain~Acute Coronary Syndromes where GTN has been ineffective|IV/IO|Adult < 70 years old: 1mcg/kg~Adult > 70 years old: 0.5mcg/kg|Weight based|Dilute 100mcg/2mls with 8mls NaCl to make 100mcg in 10mls~*Slow push over 3-5 mins*|25mcg after 5 mins as required (ramped patients MUST NOT have loading doses administered)'
      ]],
      ['Glucagon','1mg/1ml','Metabolic & Endocrine','','Hypersensitivity~Known pheochromocytoma, insulinoma, glucagonoma',[
        "Hypoglycaemia where oral glucose can't be given and unable to obtain IV.~Altered conscious state in a known diabetic or of otherwise unknown cause where BGL < 4mmol/L|IM|1mg|1 ml|Use Hypokit then 3ml Vanishpoint for injection|10 mins, repeat once if unable to obtain IV access"
      ]],
      ['Glucose 10%','50g in 500ml','Metabolic & Endocrine','','Not to be used if there is no patent IV access',[
        'Hypoglycaemia where oral glucose administration is inappropriate in:~Altered conscious state in known diabetic or other unknown cause where BGL is < 4mmol/L~Cardiac arrest, only if hypoglycaemia is suspected as contributory cause of arrest|IV|15g|150ml|Have IV NaCl 0.9% fluid bag in situ for immediate flush|If BGL < 4mmol/L after 5-10 mins give 10g / 100ml titrating to effect'
      ]],
      ['Glucose Gel','15g','Metabolic & Endocrine','','Patient unable to safely ingest gel orally / buccally',[
        'Hypoglycaemia, altered conscious state in known diabetic~unknown medical cause where BGL < 4mmol/L|PO|15g|Single Tube|N/A|Repeat after 10 mins if required'
      ]],
      ['Glyceryl Trinitrate','400mcg spray','Cardiovascular','','Hypersensitivity~Hypotension < 90mmHg~Ventricular Tachycardia (VT)~Recent use of medications used for sexual dysfunction or specific regular medication used in the treatment of pulmonary arterial hypertension: Sildenafil (Viagra) or Avanafil (Spedra) use in the previous 24 hours, Tadalafil (Cialis) use in the previous 3 days, Riociguat (Adempas)',[
        'Chest pain / discomfort of presumed cardiac origin not relieved by rest and reassurance with: systolic BP > 90 mmHg AND heart rate is within 50-150 beats per minute.~Acute Cardiac Pulmonary Oedema with systolic BP > 90 mmHg.~Autonomic Dysreflexia with systolic BP > 160 mmHg.~Suspected Irukandji sting with systolic BP > 160mmHg|SL|400mcg|1 spray|N/A|Cardiac Chest Pain: If pain persists after 5 mins & BP maintained consider further sprays of GTN at 5 mins~Acute Cardiogenic Pulmonary Oedema: If BP maintained, consider further sprays of GTN at 5 mins~Autonomic Dysreflexia: Repeat doses at 5 min intervals until symptoms resolve or systolic BP < 160mmHg~Suspected Irukandji sting: Repeat doses at 5 mins until symptoms resolve or systolic BP < 160mmHg'
      ]],
      ['Heparin','5000 IU/5ml','Cardiovascular','','Hypersensitivity to Heparin~Active bleeding (excluding menses) or disease states with increased risk of bleeding (e.g. haemophilia)',[
        'Confirmed STEMI transporting to CATH lab|IV|5000 IU|5mls|N/A|Single Dose Only'
      ]],
      ['Hydrocortisone','100mg','Respiratory, Allergy & Anaphylaxis','Metabolic & Endocrine','Hypersensitivity to hydrocortisone',[
        'Adrenal crisis in patients with known adrenal insufficiency.~Adults: Severe & life-threatening Asthma exacerbations~Paeds: Life-threatening Asthma exacerbations|IM~IV|100mg|100mg/2ml|Press down firmly on activator to force diluent into powder.~Gentle mix - DO NOT SHAKE|Single Dose Only'
      ]],
      ['Ipratropium Bromide','250mcg/1ml','Respiratory, Allergy & Anaphylaxis','','Hypersensitivity',[
        'Severe bronchospasm in severe to life-threatening Asthma or COPD|NEB|500mcg|2ml (add 2-3mL Sodium Chloride 0.9% for dilution)|Administer with 5mg Salbutamol (2.5mls)|Every 20 minutes, max 3 doses'
      ]],
      ['Ketamine','200mg/2ml','Analgesia & Local Anaesthesia','Sedation, Seizures & Behavioural','Hypersensitivity~Active cardiovascular disease including cardiac chest pain, heart failure, severe or poorly controlled hypertension~Non-pregnant Disturbed and abnormal behaviour that are not RASS 4 or when sedative agents have already been given (ASMA authority required)~Rapid Tranquilisation ONLY: < 16 years old~< 1 year old~Patients with delayed transfer of care (i.e. ramped)',[
        'Severe pain of traumatic origin~IM: 1st line agent if other means of administering pain meds not available~IV: 2nd line post IV Fentanyl|IM~IV|IM: 1mg/kg~IV: 5-20 mg|Weight based|IM - Neat~IV - Dilute 200mg/2ml with 18ml NaCl 0.9% to produce 10mg/1ml|IM - Subsequent 0.5mg/kg doses at 5 mins~IV - Subsequent 5-10 mg doses at 5 mins titrated to effect',
        '(RASS 4) Severely disturbed abnormal behaviour with immediate risk to safety - nil other sedative medications administered to this patient|IM~IV|IM: 2mg/kg in moderate/severe alcohol intoxication OR 4mg/kg in nil/mild alcohol intoxication~IV maintenance: 0.5mg/kg|Weight based|IM - Neat~IV - Dilute 200mg/2ml with 18ml NaCl 0.9% to produce 10mg/1ml|IM: repeat if necessary to max cumulative dose 200mg (mod/sev alcohol) & 400mg (nil/mild alcohol)~IV: 0.5mg/kg every 5-10 min if required',
        'Sedation in Pregnancy~First line agent if Olanzapine not suitable|IM|IM: 4mg/kg (max 400mg)|Weight based|N/A|IV/IO maintenance 0.5mg/kg every 5-10 mins IF REQUIRED',
        'CPR Induced Consciousness (CPRIC)|IV/IO|0.3-0.5 mg/kg|Weight based|IV: Dilute 200 mg in 2 mL with 18 mL NaCl 0.9% to produce 10 mg / 1 mL|Repeated once only at 5-10 minutes ONLY IF REQUIRED',
        'Combative Traumatic Brain Injury (TBI)|IM~IV/IO|IM: 2mg/kg (max 200 mg)~IV/IO: 0.5mg/kg every 5-10 if required|Weight based||'
      ]],
      ['Lignocaine 1%','20mg/2ml','Analgesia & Local Anaesthesia','Cardiovascular','Hypersensitivity',[
        'Local anaesthesia for:~IV Cannulation~IO infusion|ID|0.1 ml|0.1ml|N/A|Second site if needed',
        '|IO|Small adult: 20mg/2ml~Adult: 40mg/4mls|4ml (2 ampoules)||',
        'Cardiac Arrest with persistent or recurrent Ventricular Fibrillation / pulseless Ventricular Tachycardia, refractory to defibrillation strategies and maximum dose of Amiodarone as per Cardiac Arrest CPG (Clinical exception required)|IV/IO|1mg/kg|Weight based|N/A|May be repeated once if sufficient supply'
      ]],
      ['Loratadine','10mg','Respiratory, Allergy & Anaphylaxis','','Children under 30 kg~Hypersensitivity to loratadine',[
        'Symptomatic urticaria (without evidence of anaphylaxis)|PO|10mg|10mg|N/A|Single Dose'
      ]],
      ['Methoxyflurane','3ml','Analgesia & Local Anaesthesia','','Hypersensitivity to fluorinated anaesthetics~< 1 year old~Patients unable to co-operate including those affected by alcohol or illicit drugs~Patients with a severe head injury and altered state of consciousness~Patients susceptible to malignant hyperthermia',[
        'Analgesia|IH|3ml|3ml|N/A|Repeat at 30 mins if required (max 6mls/day & 15mls/week)'
      ]],
      ['Midazolam','15mg/3ml','Sedation, Seizures & Behavioural','','Hypersensitivity~Use of Midazolam for sedation after Ketamine requires ASMA Authority (non-pregnant) or STORC consult (pregnant)',[
        'Prolonged seizure activity ≥ 5 mins OR recurrent / status activity~Focal seizure activity which is prolonged ≥ 5 mins with a GCS ≤ 12~Second-line IV agent for maintenance of sedation after Droperidol for disturbed and/or abnormal behaviour~Second-line IV agent for maintenance of sedation after Ketamine in pregnant patients|||||',
        '#Seizures',
        '|IM|Adult < 70 years: 5mg~Adult > 70 years or frail: 2.5mg|IM 0.5-1ml, age dependent|N/A|2.5-5 mg, repeat once after 10 mins if no IV access (age dependent)',
        '|IV/IO|< 70 years: 2.5-5mg~> 70 years: 2.5mg|IV/IO 2.5-5mls, age dependent|IV/IO: Dilute 15mg/3mls with 12mls NaCl in 20 ml syringe (1mg/ml)|< 70 years: 2.5mg repeat every 5 mins (max dose 15mg)~Adult > 70 years: 1mg every 5 mins (max 15mg)',
        '#Maintenance of Sedation (IV Only)',
        '|IV|Adult < 70 years: 1-2 mg~> 70 years: 0.5-1 mg|0.5-2mls, age dependent|IV/IO: Dilute 15mg/3mls with 12mls NaCl in 20 ml syringe (1mg/ml)|< 70 years: titrate to effect every 5-10 mins as required (max 5mg)~> 70 years: titrate to effect every 5-10 mins as required (max 5mg)'
      ]],
      ['Naloxone','400mcg/1ml','Toxicology & Overdose','','Hypersensitivity to Naloxone',[
        'Reversal of respiratory depression in suspected narcotic overdose|IM/IV/IO|400-800mcg|IM: 1-2mls~IV: 10-20mls|IM: Neat~IV: Dilute 400mcg/1ml with 9ml NaCl 0.9% to produce 40mcg/1ml|Repeat dose every 2 minutes as required titrated to effect to MAX 10mg'
      ]],
      ['Olanzapine','5mg','Sedation, Seizures & Behavioural','','Known allergy~Known Parkinsons Disease~< 6 years old',[
        'Disturbed and Abnormal Behaviour (RASS 1-3) where risk to safety is evident and de-escalation not effective~Patient can tolerate or self-administer oral wafer~Preferred first line sedation in frail patients and those with Dementia|PO|Adult < 70 years: 10mg~Adult > 70 years or frail: 5mg|1-2 dispersible tablets (age based)|N/A|Adults < 70 years: repeat as necessary after 15 mins to MAX cumulative dose 20mg/24 hours~Adults > 70 years or frail: repeat as necessary after 15 mins to MAX cumulative dose 10mg/24 hours'
      ]],
      ['Ondansetron','4mg','Nausea & Vomiting','','Hypersensitivity to Ondansetron~Treatment with apomorphine: risk of severe hypotension and loss of consciousness if given to patient taking apomorphine~< 2 years old',[
        'Moderate to severe nausea~Active vomiting~Nausea and vomiting prophylaxis for eye and spinal injuries|PO|4mg|1 wafer|N/A|After 15 mins - no further for 8 hours post 2nd dose',
        '|IM||2mls|N/A|',
        '|IV||Pushed over at least 30 seconds but preferably 3-5 mins|IV: Add 8mls NaCl to make 4mg in 10mls|'
      ]],
      ['Oxytocin','10 IU/1ml','Obstetrics','','Foetus remaining in uterus, multiple pregnancy must be excluded prior to administration~Within 6 hours of vaginal prostaglandins~Allergy to oxytocin. Latex allergy may be a risk factor for oxytocin hypersensitivity',[
        'Partial active management of third stage of labour~Treatment of postpartum haemorrhage (PPH): Primary: > 500ml blood loss within 24 hours of birth. Secondary: > 500ml blood loss between 24 hours and 12 weeks postpartum|IM|10 IU|1ml|Third stage management of labour: 3 mins post delivery of baby, when cord stops pulsating~PPH Management: 10 IU|Single Dose'
      ]],
      ['Paracetamol','500mg tablet','Analgesia & Local Anaesthesia','','Hypersensitivity to Paracetamol',[
        'Mild to moderate pain e.g. headache, sprain~As component of a multimodal analgesic regime|PO|500-1000mg|1-2 tablets|N/A|Repeated 4-6 hourly as required~Max dose 4g (8 tablets) per day'
      ]],
      ['Salbutamol','5mg/2.5ml','Respiratory, Allergy & Anaphylaxis','','Known hypersensitivity to salbutamol~Cardiogenic pulmonary oedema~< 12 months old',[
        'Bronchospasm and respiratory distress associated with wheeze:~Acute Bronchial Asthma~Bronchitis~Smoke inhalation~Severe allergic / anaphylactic reactions~APO (Non-Cardiac)~Salt Water Aspiration Syndrome~COPD|NEB|Asthma: moderate/severe - 5mg; life-threatening - 10mg~COPD - 5mg~Other conditions - 5-10mg|1-2 nebules, indication dependent|6-8L/min oxygen|Repeat as clinically required',
        '|MDI|4-12 puffs (400-1200mcg)|N/A|Recommended to use spacer|Repeat every 20 minutes or sooner if needed for the first hour'
      ]],
      ['Sodium Chloride 0.9%','250ml, 500ml or 1000ml soft bag','Trauma, Haemorrhage & Fluids','Cardiovascular','Severe pulmonary oedema',[
        'Fluid therapy for shock, DKA & Hyperosmolar Hyperglycaemic State|IV/IO|250 mls|250mls||Adult: 250 ml boluses to MAX 2000mls~Small adult / elderly: 250 mls boluses to MAX 1000mls',
        'Haemorrhage|IV/IO|250mls|250 ml||250 ml boluses to MAX 2000mls',
        'Cardiac Arrest|IV/IO|20ml/kg|Weight based||Bolus dose as reversible cause',
        'ROSC|IV/IO|250ml|250mls||250 ml boluses to MAX 500ml with reassessment between each infusion',
        'Burns (Adult) > 15% TBSA|IV|2ml x TBSA x weight in kg|Weight based||50% of total amount over first 8 hours~50% of total amount over next 16 hours'
      ]],
      ['Tranexamic Acid','1g/10ml','Trauma, Haemorrhage & Fluids','Obstetrics','Known hypersensitivity to Tranexamic Acid~Injury time more than 3 hours',[
        'Significant trauma (< 3 hours) with signs of hypovolaemia~Significant active haemorrhaging requiring tourniquet or haemostatic dressings~Suspected head injury (< 3 hours) with GCS motor score of 4 (withdrawing from pain) or below~Severe primary or secondary PPH (> 500ml) or PPH with signs of hypovolaemia (birth/bleed < 3 hours)~Significant post-tonsillectomy haemorrhage|IV|1g slowly over 10 minutes||Rapid administration may cause hypotension|Single Dose Only'
      ]]
    ];
    const sp = (s) => (s || '').split('~').map(x => x.trim()).filter(Boolean);
  _drugs = R.map(([n, p, g, also, ci, rows]) => {
      const parsed = rows.map(r => {
        if(r.charAt(0) === '#') return { hdr: r.slice(1), body: false, i: [], r: [], d: [], v: [], x: [], rp: [], fields: [] };
        const c = r.split('|');
        const o = { hdr: '', body: true, i: sp(c[0]), r: sp(c[1]), d: sp(c[2]), v: sp(c[3]), x: sp(c[4]), rp: sp(c[5]) };
        o.hasInd = o.i.length > 0;
        o.hasDose = o.r.length + o.d.length + o.v.length + o.x.length + o.rp.length > 0;
        o.fields = [
          { label: 'Route', lines: o.r, size: '13px', color: '#31363F', weight: '500' },
          { label: 'Dose', lines: o.d, size: '14px', color: '#B4551E', weight: '500' },
          { label: 'Initial volume', lines: o.v, size: '13px', color: '#31363F', weight: '400' },
          { label: 'Dilution / notes', lines: o.x, size: '13px', color: '#5A6068', weight: '400' },
          { label: 'Repeat', lines: o.rp, size: '13px', color: '#31363F', weight: '400' }
        ].map(f => (f.lines.length ? f : Object.assign({}, f, { lines: ['—'] })));
        return o;
      });
      const routes = [];
      parsed.forEach(r => r.r.forEach(x => x.split('/').forEach(y => { const t = y.trim(); if(t && routes.indexOf(t) < 0) routes.push(t); })));
      const blob = [n, p, g, also, ci, rows.join(' ')].join(' ').toLowerCase();
      return { n, p, g, also, gShort: SHORT[g] || g, ci: sp(ci), rows: parsed, routes, blob };
    });
  return _drugs;
}

// ---- distractor safety ----------------------------------------------------
// Two drugs can be equally correct for the same stem while their rows are worded
// differently, so exact-string matching is not enough to keep a rival out of a
// "which drug?" answer set. Two guards below: named clinical clusters, and a
// significant-word overlap test for the paraphrases nobody enumerated.

const STOP = {the:1,a:1,an:1,of:1,or:1,and:1,in:1,to:1,for:1,with:1,where:1,is:1,are:1,be:1,not:1,no:1,on:1,as:1,at:1,by:1,from:1,that:1,this:1,other:1,others:1,unknown:1,known:1,patient:1,patients:1,cause:1,causes:1,due:1,any:1,all:1,its:1,has:1,have:1,been:1,who:1,can:1,may:1,must:1,only:1};
function words(s){ return (s || '').toLowerCase().split(/[^a-z0-9%<>]+/).filter(w => w.length > 2 && !STOP[w]); }

// Drugs the 2026 list points at the same presentation. A stem belonging to one
// member must never offer another member as a wrong answer.
const CLUSTERS = [
  { keys: ['rass', 'disturbed', 'abnormal behaviour', 'sedation', 'tranquilisation', 'de-escalation'], drugs: ['Olanzapine', 'Droperidol', 'Midazolam', 'Ketamine'] },
  { keys: ['hypoglycaemia', 'bgl', 'glucose', 'diabetic'], drugs: ['Glucose 10%', 'Glucose Gel', 'Glucagon'] },
  { keys: ['asthma', 'copd', 'bronchospasm', 'wheeze', 'bronchial'], drugs: ['Salbutamol', 'Ipratropium Bromide', 'Adrenaline', 'Hydrocortisone'] },
  { keys: ['anaphyla', 'urticaria', 'allergic'], drugs: ['Adrenaline', 'Hydrocortisone', 'Salbutamol', 'Loratadine'] },
  { keys: ['pain', 'analgesia', 'anaesthesia'], drugs: ['Fentanyl (IN)', 'Fentanyl Citrate (IV)', 'Ketamine', 'Methoxyflurane', 'Paracetamol', 'Cophenylcaine', 'Lignocaine 1%'] },
  { keys: ['cardiac arrest', 'rosc', 'ventricular fibrillation', 'pulseless'], drugs: ['Adrenaline', 'Amiodarone', 'Lignocaine 1%', 'Sodium Chloride 0.9%'] },
  { keys: ['haemorrhag', 'pph', 'hypovolaemia', 'blood loss', 'postpartum'], drugs: ['Tranexamic Acid', 'Oxytocin', 'Sodium Chloride 0.9%'] },
  { keys: ['chest pain', 'coronary', 'stemi', 'cardiac origin'], drugs: ['Glyceryl Trinitrate', 'Aspirin', 'Fentanyl (IN)', 'Fentanyl Citrate (IV)', 'Heparin'] },
  { keys: ['seizure', 'status', 'ictal'], drugs: ['Midazolam'] },
  { keys: ['nausea', 'vomiting'], drugs: ['Ondansetron'] },
  { keys: ['parkinson'], drugs: ['Olanzapine', 'Droperidol'] },
  { keys: ['pregnan', 'foetus', 'uterus'], drugs: ['Cophenylcaine', 'Droperidol', 'Oxytocin'] },
  { keys: ['pulmonary oedema', 'apo'], drugs: ['Glyceryl Trinitrate', 'Salbutamol', 'Sodium Chloride 0.9%'] }
];

// every drug that must be withheld from a "which drug?" answer set for this stem
export function rivalDrugs(stemLines, drug){
  const txt = (stemLines || []).join(' ').toLowerCase();
  const out = {};
  CLUSTERS.forEach(c => {
    if(c.drugs.indexOf(drug) < 0) return;
    if(!c.keys.some(k => txt.indexOf(k) >= 0)) return;
    c.drugs.forEach(n => { out[n] = 1; });
  });
  return out;
}

// true when a candidate's own row says substantially the same thing as the stem
export function overlaps(stemLines, candLines){
  const S = (stemLines || []).map(words).filter(w => w.length > 1);
  if(!S.length) return false;
  return (candLines || []).some(cl => {
    const c = words(cl);
    if(c.length < 2) return false;
    return S.some(s => {
      const hit = c.filter(w => s.indexOf(w) >= 0).length;
      return hit / Math.min(c.length, s.length) >= 0.6;
    });
  });
}

// Strings the list uses for the SAME clinical finding. Drug clusters can't help here —
// these are compared as answer TEXT, and they share no words to match on.
const SYNONYMS = [
  ['Pregnancy', 'Patients known or suspected to be pregnant', 'Foetus remaining in uterus, multiple pregnancy must be excluded prior to administration']
];
const nk = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// grow a ban list to cover every synonym of everything already in it
export function expandBan(list){
  const out = (list || []).slice();
  SYNONYMS.forEach(g => {
    if(!out.some(v => g.some(m => nk(m) === nk(v)))) return;
    g.forEach(m => { if(!out.some(v => nk(v) === nk(m))) out.push(m); });
  });
  return out;
}
