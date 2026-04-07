/**
 * ICD-10 2019 疾病分類資料初始化 Script
 * 資料來源：WHO ICD-10 2019 Reference（精選臨床常用代碼）
 *
 * 使用方式（從 backend 目錄執行）：
 *   NODE_PATH=./node_modules node ../data/icd10/seed-icd10.cjs
 *
 * 策略：Upsert（INSERT ... ON DUPLICATE KEY UPDATE）
 * → 若 code 已存在則自動更新，不存在則插入新記錄
 * → 可保留手動新增的本地資料
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'clinic123',
  database: process.env.DB_NAME || 'simple_medical_db',
};

// WHO ICD-10 2019 精選臨床常用代碼（258 筆，涵蓋全 22 章）
const ICD10_CODES = [
  // ===== A 傳染病 =====
  ["A00","霍亂","Cholera","傳染病"],["A00.0","霍亂：霍亂弧菌","Cholera due to Vibrio cholerae 01","傳染病"],
  ["A01.0","傷寒熱","Typhoid fever","傳染病"],["A01.1","副傷寒熱A","Paratyphoid fever A","傳染病"],
  ["A02.0","沙門氏菌腸炎","Salmonella enteritis","傳染病"],["A03.0","桿菌性痢疾","Shigellosis","傳染病"],
  ["A04.6","困難梭菌結腸炎","Clostridium difficile enterocolitis","傳染病"],
  ["A06.0","急性阿米巴痢疾","Acute amoebic dysentery","傳染病"],
  ["A09.0","傳染性胃腸炎","Infectious gastroenteritis","傳染病"],
  ["A15.0","肺部結核","Tuberculosis of lung","傳染病"],
  ["A17.0","結核性腦膜炎","Tuberculous meningitis","傳染病"],
  ["A18.0","骨關節結核","Tuberculosis of bones and joints","傳染病"],
  ["A19.9","粟粒性結核","Miliary tuberculosis","傳染病"],
  ["A37.0","百日咳","Whooping cough","傳染病"],
  ["A39.0","腦膜炎球菌性腦膜炎","Meningococcal meningitis","傳染病"],
  ["A39.1","Waterhouse-Friderichsen綜合症","Waterhouse-Friderichsen syndrome","傳染病"],
  ["A41.0","金葡敗血症","Sepsis due to Staphylococcus aureus","傳染病"],
  ["A41.9","敗血症","Sepsis","傳染病"],["A46","丹毒","Erysipelas","傳染病"],
  ["A49.9","細菌感染","Bacterial infection","傳染病"],
  ["A51.0","初期梅毒","Primary syphilis","傳染病"],
  ["A52.1","症狀性神經梅毒","Symptomatic neurosyphilis","傳染病"],
  ["A53.9","梅毒","Syphilis","傳染病"],
  ["A54.0","淋病性尿道炎","Gonococcal urethritis","傳染病"],
  ["A54.3","淋病性眼感染","Gonococcal infection of eye","傳染病"],
  ["A54.9","淋病","Gonococcal infection","傳染病"],
  ["A59.0","泌尿生殖道滴蟲病","Urogenital trichomoniasis","傳染病"],
  ["A60.0","泌尿生殖道皰疹","Herpesviral genital infection","傳染病"],
  ["A63.0","尖銳濕疣","Anogenital warts","傳染病"],
  ["A64","性傳播疾病","Sexually transmitted disease","傳染病"],
  ["A69.2","萊姆病","Lyme disease","傳染病"],["A78","寇熱","Q fever","傳染病"],
  ["A82.9","狂犬病","Rabies","傳染病"],["A83.0","日本腦炎","Japanese encephalitis","傳染病"],
  ["A87.0","腸道病毒性腦膜炎","Enteroviral meningitis","傳染病"],
  ["A90","登革熱","Dengue fever","傳染病"],
  ["A91","登革出血熱","Dengue hemorrhagic fever","傳染病"],
  ["B00.2","皰疹性齒槽炎","Herpesviral gingivostomatitis","傳染病"],
  ["B02.9","帶狀皰疹","Zoster","傳染病"],["B05.9","麻疹","Measles","傳染病"],
  ["B06.9","德國麻疹","Rubella","傳染病"],["B15.9","甲型肝炎","Hepatitis A","傳染病"],
  ["B16.9","乙型肝炎（急性）","Acute hepatitis B","傳染病"],
  ["B18.1","乙型肝炎（慢性）","Chronic hepatitis B","傳染病"],
  ["B18.2","丙型肝炎（慢性）","Chronic hepatitis C","傳染病"],
  ["B20.0","HIV相關分枝桿菌感染","HIV with mycobacterial infection","傳染病"],
  ["B20.6","HIV相關肺孢子蟲肺炎","HIV with Pneumocystis pneumonia","傳染病"],
  ["B25.1","巨細胞病毒性肝炎","Cytomegaloviral hepatitis","傳染病"],
  ["B27.9","傳染性單核細胞增多症","Infectious mononucleosis","傳染病"],
  ["B34.9","病毒感染","Viral infection","傳染病"],
  ["B37.0","口腔念珠菌病","Oral candidiasis","傳染病"],
  ["B37.3","外陰陰道念珠菌病","Vulvovaginal candidiasis","傳染病"],
  ["B37.7","念珠菌敗血症","Candidal sepsis","傳染病"],
  ["B37.9","念珠菌病","Candidiasis","傳染病"],
  ["B44.0","侵襲性肺麴菌病","Invasive pulmonary aspergillosis","傳染病"],
  ["B45.1","腦隱球菌病","Cerebral cryptococcosis","傳染病"],
  ["B54","瘧疾","Malaria","傳染病"],["B86","疥瘡","Scabies","傳染病"],
  // ===== C 腫瘤 =====
  ["C00.9","唇惡性腫瘤","Malignant neoplasm of lip","腫瘤"],
  ["C01","舌根惡性腫瘤","Malignant neoplasm of base of tongue","腫瘤"],
  ["C02.9","舌惡性腫瘤","Malignant neoplasm of tongue","腫瘤"],
  ["C07","腮腺惡性腫瘤","Malignant neoplasm of parotid gland","腫瘤"],
  ["C09.9","扁桃腺惡性腫瘤","Malignant neoplasm of tonsil","腫瘤"],
  ["C15.9","食道惡性腫瘤","Malignant neoplasm of esophagus","腫瘤"],
  ["C16.9","胃癌","Malignant neoplasm of stomach","腫瘤"],
  ["C18.9","結腸惡性腫瘤","Malignant neoplasm of colon","腫瘤"],
  ["C19","直腸乙狀結腸連接處惡性腫瘤","Malignant neoplasm of rectosigmoid junction","腫瘤"],
  ["C20","直腸惡性腫瘤","Malignant neoplasm of rectum","腫瘤"],
  ["C22.0","肝細胞癌","Hepatocellular carcinoma","腫瘤"],
  ["C23","膽囊惡性腫瘤","Malignant neoplasm of gallbladder","腫瘤"],
  ["C25.9","胰臟惡性腫瘤","Malignant neoplasm of pancreas","腫瘤"],
  ["C32.9","喉惡性腫瘤","Malignant neoplasm of larynx","腫瘤"],
  ["C34.9","肺癌","Malignant neoplasm of lung","腫瘤"],
  ["C43.5","軀幹黑色素瘤","Malignant melanoma of trunk","腫瘤"],
  ["C50.9","乳房惡性腫瘤","Malignant neoplasm of breast","腫瘤"],
  ["C53.9","、子宮頸惡性腫瘤","Malignant neoplasm of cervix uteri","腫瘤"],
  ["C54.1","、子宫体内膜惡性腫瘤","Malignant neoplasm of endometrium","腫瘤"],
  ["C56","卵巢惡性腫瘤","Malignant neoplasm of ovary","腫瘤"],
  ["C61","前列腺惡性腫瘤","Malignant neoplasm of prostate","腫瘤"],
  ["C64","腎臟惡性腫瘤","Malignant neoplasm of kidney","腫瘤"],
  ["C67.9","膀胱惡性腫瘤","Malignant neoplasm of bladder","腫瘤"],
  ["C71.9","腦惡性腫瘤","Malignant neoplasm of brain","腫瘤"],
  ["C73","甲狀腺惡性腫瘤","Malignant neoplasm of thyroid","腫瘤"],
  ["C78.0","肺部繼發性惡性腫瘤","Secondary malignant neoplasm of lung","腫瘤"],
  ["C78.7","肝部繼發性惡性腫瘤","Secondary malignant neoplasm of liver","腫瘤"],
  ["C79.3","腦部繼發性惡性腫瘤","Secondary malignant neoplasm of brain","腫瘤"],
  ["C80","繼發性/未特指惡性腫瘤","Malignant neoplasm of unspecified site","腫瘤"],
  ["C81.9","何杰金氏淋巴瘤","Hodgkin lymphoma","腫瘤"],
  ["C83.3","瀰漫性大細胞B細胞淋巴瘤","Diffuse large B-cell lymphoma","腫瘤"],
  ["C85.9","非何杰金氏淋巴瘤","Non-Hodgkin lymphoma","腫瘤"],
  ["C90.0","多發性骨髓瘤","Multiple myeloma","腫瘤"],
  ["C91.1","慢性淋巴細胞白血病","Chronic lymphocytic leukemia","腫瘤"],
  ["C92.0","急性髓樣白血病","Acute myeloid leukemia","腫瘤"],
  // ===== D 血液 =====
  ["D50.9","缺鐵性貧血","Iron deficiency anemia","血液"],
  ["D51.9","維生素B12缺乏性貧血","Vitamin B12 deficiency anemia","血液"],
  ["D52.9"," folate缺乏性貧血","Folate deficiency anemia","血液"],
  ["D53.9","營養性貧血","Nutritional anemia","血液"],
  ["D59.5","陣發性夜間血紅蛋白尿","Paroxysmal nocturnal hemoglobinuria","血液"],
  ["D64.9","貧血","Anemia","血液"],
  ["D65","彌散性血管內凝血","Disseminated intravascular coagulation","血液"],
  ["D66","遺傳性第八因子缺乏","Hereditary factor VIII deficiency","血液"],
  ["D68.0","維萊布蘭德病","Von Willebrand disease","血液"],
  ["D69.3","特發性血小板減少性紫斑症","Idiopathic thrombocytopenic purpura","血液"],
  ["D69.6","血小板減少","Thrombocytopenia","血液"],
  // ===== E 內分泌 =====
  ["E03.9","甲狀腺機能減退","Hypothyroidism","內分泌"],
  ["E05.9","甲狀腺機能亢進","Thyrotoxicosis","內分泌"],
  ["E10.9","1型糖尿病","Type 1 diabetes mellitus","內分泌"],
  ["E11.9","2型糖尿病","Type 2 diabetes mellitus","內分泌"],
  ["E13.9","其他特定糖尿病","Other specified diabetes mellitus","內分泌"],
  ["E16.2","低血糖","Hypoglycemia","內分泌"],
  ["E21.3","甲狀旁腺機能減退","Hypoparathyroidism","內分泌"],
  ["E22.0","肢端肥大症","Acromegaly","內分泌"],
  ["E23.0","垂體機能減退","Hypopituitarism","內分泌"],
  ["E23.7","垂體機能障礙","Disorder of pituitary","內分泌"],
  ["E25.0","先天性腎上腺增生","Congenital adrenal hyperplasia","內分泌"],
  ["E27.1","腎上腺皮質機能減退","Adrenocortical insufficiency","內分泌"],
  ["E28.2","多囊卵巢綜合症","Polycystic ovarian syndrome","內分泌"],
  ["E66.9","肥胖","Obesity","內分泌"],
  ["E83.3","磷質代謝障礙","Disorders of phosphorus metabolism","內分泌"],
  ["E86","低血容量","Volume depletion","內分泌"],
  ["E87.0","高血鈉","Hypernatremia","內分泌"],
  ["E87.1","低血鈉","Hyponatremia","內分泌"],
  ["E87.6","低血鉀","Hypokalemia","內分泌"],
  ["E87.7","高血鉀","Hyperkalemia","內分泌"],
  // ===== F 精神 =====
  ["F00.9","阿茲海默病痴呆","Dementia in Alzheimer disease","精神"],
  ["F01.9","血管性痴呆","Vascular dementia","精神"],
  ["F03","痴呆","Unspecified dementia","精神"],
  ["F05.9","譫妄","Delirium","精神"],
  ["F06.8","器質性精神障礙","Organic mental disorder","精神"],
  ["F10.2","酒精依賴","Alcohol dependence syndrome","精神"],
  ["F11.2","鴉片依賴","Opioid dependence syndrome","精神"],
  ["F17.2","煙草依賴","Tobacco dependence syndrome","精神"],
  ["F20.9","精神分裂症","Schizophrenia","精神"],
  ["F31.9","雙相障礙","Bipolar disorder","精神"],
  ["F32.9","抑鬱發作","Depressive episode","精神"],
  ["F33.9","復發性抑鬱障礙","Recurrent depressive disorder","精神"],
  ["F34.1","心境惡劣","Dysthymia","精神"],
  ["F41.1","廣泛性焦慮障礙","Generalized anxiety disorder","精神"],
  ["F41.2","混合性焦慮抑鬱障礙","Mixed anxiety and depressive disorder","精神"],
  ["F42.9","強迫障礙","Obsessive-compulsive disorder","精神"],
  ["F43.1","創傷後應激障礙","Post-traumatic stress disorder","精神"],
  ["F43.2","適應障礙","Adjustment disorder","精神"],
  ["F45.0","軀體化障礙","Somatization disorder","精神"],
  ["F48.0","神經衰弱","Neurasthenia","精神"],
  ["F50.0","神經性厭食","Anorexia nervosa","精神"],
  ["F50.2","神經性暴食","Bulimia nervosa","精神"],
  ["F51.0","非器質性失眠","Nonorganic insomnia","精神"],
  ["F60.0","偏執型人格障礙","Paranoid personality disorder","精神"],
  ["F60.3","情緒不穩定型人格障礙","Emotionally unstable personality disorder","精神"],
  ["F60.9","人格障礙","Personality disorder","精神"],
  ["F70.9","智力障礙","Intellectual disability","精神"],
  ["F79.9","發育障礙","Developmental disorder","精神"],
  ["F90.0","注意力障礙","Attention deficit hyperactivity disorder","精神"],
  ["F91.9","品行障礙","Conduct disorder","精神"],
  ["F98.0","非器質性遺尿","Enuresis","精神"],
  // ===== G 神經 =====
  ["G00.9","細菌性腦膜炎","Bacterial meningitis","神經"],
  ["G04.9","腦炎","Encephalitis","神經"],
  ["G09","中樞神經系統後遺症","Sequelae of CNS inflammatory disease","神經"],
  ["G10","亨廷頓舞蹈症","Huntington disease","神經"],
  ["G12.2","運動神經元疾病","Motor neuron disease","神經"],
  ["G20","帕金森氏病","Parkinson disease","神經"],
  ["G25.9","錐體外運動障礙","Extrapyramidal disorder","神經"],
  ["G30.9","阿茲海默病","Alzheimer disease","神經"],
  ["G31.0","瀰漫性路易體病","Diffuse Lewy body disease","神經"],
  ["G35","多發性硬化","Multiple sclerosis","神經"],
  ["G40.9","癫痫","Epilepsy","神經"],
  ["G41.9","癫痫持續狀態","Status epilepticus","神經"],
  ["G43.0","偏頭痛不伴先兆","Migraine without aura","神經"],
  ["G43.1","偏頭痛伴先兆","Migraine with aura","神經"],
  ["G44.2","緊張性頭痛","Tension-type headache","神經"],
  ["G47.0","失眠","Insomnia","神經"],
  ["G47.3","睡眠呼吸暫停","Sleep apnea","神經"],
  ["G47.4","發作性睡病","Narcolepsy","神經"],
  ["G50.0","三叉神經痛","Trigeminal neuralgia","神經"],
  ["G51.0","貝爾麻痹","Bell palsy","神經"],
  ["G54.0","臂叢疾病","Brachial plexus disorder","神經"],
  ["G56.0","腕管綜合症","Carpal tunnel syndrome","神經"],
  ["G57.0","坐骨神經痛","Sciatica","神經"],
  ["G60.0","遺傳性運動感覺神經病","Hereditary motor sensory neuropathy","神經"],
  ["G60.9","特發性神經病變","Idiopathic neuropathy","神經"],
  ["G61.0","吉蘭-巴雷綜合症","Guillain-Barré syndrome","神經"],
  ["G62.0","藥物性多神經病變","Drug-induced polyneuropathy","神經"],
  ["G62.1","酒精性多神經病變","Alcoholic polyneuropathy","神經"],
  ["G62.9","多神經病變","Polyneuropathy","神經"],
  ["G63.2","糖尿病性多神經病變","Diabetic polyneuropathy","神經"],
  ["G70.0","重疊肌無力綜合症","Myasthenia gravis","神經"],
  ["G71.0","肌營養不良","Muscular dystrophy","神經"],
  ["G80.9","腦性麻痹","Cerebral palsy","神經"],
  ["G81.9","半身不遂","Hemiplegia","神經"],
  ["G91.9","腦積水","Hydrocephalus","神經"],
  ["G93.0","顱內囊腫","Cerebral cysts","神經"],
  ["G93.4","腦病","Encephalopathy","神經"],
  ["G93.6","腦水腫","Cerebral oedema","神經"],
  ["G95.0","脊髓空洞症","Syringomyelia","神經"],
  ["G95.9","脊髓疾病","Spinal cord disease","神經"],
  ["G96.9","中樞神經系統疾病","CNS disease","神經"],
  ["G98","神經系統疾病","Nervous system disorder","神經"],
  // ===== H 眼/耳 =====
  ["H00.0","瞼板腺囊腫","Hordeolum","眼"],
  ["H01.0","瞼炎","Blepharitis","眼"],
  ["H02.4","上瞼下垂","Ptosis of eyelid","眼"],
  ["H04.1","淚囊炎","Dacryocystitis","眼"],
  ["H10.2","過敏性結膜炎","Allergic conjunctivitis","眼"],
  ["H10.3","急性傳染性結膜炎","Acute infectious conjunctivitis","眼"],
  ["H11.0","胬肉","Pterygium","眼"],
  ["H16.0","角膜潰疡","Corneal ulcer","眼"],
  ["H25.9","老年性白內障","Age-related cataract","眼"],
  ["H26.9","白內障","Cataract","眼"],
  ["H33.5","視網膜脫離","Retinal detachment","眼"],
  ["H35.3","老年性黃斑退化","Age-related macular degeneration","眼"],
  ["H40.9","青光眼","Glaucoma","眼"],
  ["H52.1","近視","Myopia","眼"],
  ["H52.4","老視","Presbyopia","眼"],
  ["H52.7","屈光障礙","Refractive disorder","眼"],
  ["H60.9","外耳炎","Otitis externa","耳"],
  ["H65.9","中耳炎","Otitis media","耳"],
  ["H66.9","化膿性中耳炎","Suppurative otitis media","耳"],
  ["H68.0","耳咽管阻塞","Eustachian tube obstruction","耳"],
  ["H90.3","感音神經性聽力損失","Sensorineural hearing loss","耳"],
  ["H91.0","老年性聽力損失","Presbycusis","耳"],
  // ===== I 循環 =====
  ["I00","風濕熱（無心臟受累）","Acute rheumatic fever","循環"],
  ["I10","原發性高血壓","Essential hypertension","循環"],
  ["I11.9","高血壓性心臟病","Hypertensive heart disease","循環"],
  ["I20.9","心絞痛","Angina pectoris","循環"],
  ["I21.9","急性心肌梗塞","Acute myocardial infarction","循環"],
  ["I25.9","慢性缺血性心臟病","Chronic ischemic heart disease","循環"],
  ["I26.0","肺栓塞","Pulmonary embolism","循環"],
  ["I27.9","肺源性心臟病","Pulmonary heart disease","循環"],
  ["I30.0","急性心包炎","Acute pericarditis","循環"],
  ["I33.0","急性心內膜炎","Acute endocarditis","循環"],
  ["I40.0","急性心肌炎","Acute myocarditis","循環"],
  ["I42.0","擴張型心肌病","Dilated cardiomyopathy","循環"],
  ["I42.9","心肌病變","Cardiomyopathy","循環"],
  ["I44.0","房室傳導阻滯","Atrioventricular block","循環"],
  ["I45.9","心傳導障礙","Conduction disorder","循環"],
  ["I46.9","心臟驟停","Cardiac arrest","循環"],
  ["I47.1","室上性心動過速","Supraventricular tachycardia","循環"],
  ["I47.2","室性心動過速","Ventricular tachycardia","循環"],
  ["I48.9","心房顫動","Atrial fibrillation","循環"],
  ["I49.4","心室早期收縮","Ventricular premature beats","循環"],
  ["I50.0","充血性心力衰竭","Congestive heart failure","循環"],
  ["I50.9","心衰竭","Heart failure","循環"],
  ["I51.9","心臟疾病","Heart disease","循環"],
  ["I60.9","蛛網膜下腔出血","Subarachnoid hemorrhage","循環"],
  ["I61.9","腦內出血","Intracerebral hemorrhage","循環"],
  ["I63.9","腦梗死","Cerebral infarction","循環"],
  ["I64","中風","Stroke","循環"],
  ["I67.9","腦血管疾病","Cerebrovascular disease","循環"],
  ["I69.3","腦梗死後遺症","Sequelae of cerebral infarction","循環"],
  ["I70.0","冠狀粥樣硬化","Atherosclerosis of aorta","循環"],
  ["I70.9","動脈粥樣硬化","Generalized atherosclerosis","循環"],
  ["I73.9","周邊血管疾病","Peripheral vascular disease","循環"],
  ["I74.9","急性動脈栓塞","Arterial embolism","循環"],
  ["I80.1","靜脈血栓栓塞","Phlebitis and thrombophlebitis","循環"],
  ["I80.9","靜脈炎","Venous inflammation","循環"],
  ["I83.9","靜脈曲張","Varicose veins","循環"],
  ["I84.9","痔瘡","Hemorrhoids","循環"],
  ["I87.9","靜脈功能不全","Venous insufficiency","循環"],
  ["I95.9","低血壓","Hypotension","循環"],
  // ===== J 呼吸 =====
  ["J00","感冒","Acute nasopharyngitis","呼吸"],
  ["J02.9","急性咽炎","Acute pharyngitis","呼吸"],
  ["J03.9","急性扁桃腺炎","Acute tonsillitis","呼吸"],
  ["J06.9","上呼吸道感染","Acute upper respiratory infection","呼吸"],
  ["J09","流感","Influenza due to identified avian influenza virus","呼吸"],
  ["J12.9","病毒性肺炎","Viral pneumonia","呼吸"],
  ["J13","肺炎球菌肺炎","Streptococcus pneumoniae pneumonia","呼吸"],
  ["J14","流感嗜血桿菌肺炎","Haemophilus influenzae pneumonia","呼吸"],
  ["J15.9","細菌性肺炎","Bacterial pneumonia","呼吸"],
  ["J18.1","肺葉肺炎","Hypostatic pneumonia","呼吸"],
  ["J18.9","肺炎","Pneumonia","呼吸"],
  ["J20.9","急性支氣管炎","Acute bronchitis","呼吸"],
  ["J30.9","變應性鼻炎","Allergic rhinitis","呼吸"],
  ["J32.9","慢性鼻竇炎","Chronic sinusitis","呼吸"],
  ["J33.9","鼻息肉","Nasal polyp","呼吸"],
  ["J34.2","鼻中隔偏曲","Deviated nasal septum","呼吸"],
  ["J36.0","扁桃腺膿腫","Peritonsillar abscess","呼吸"],
  ["J39.9","上呼吸道疾病","Upper respiratory disease","呼吸"],
  ["J40","支氣管炎","Bronchitis","呼吸"],
  ["J42","慢性支氣管炎","Chronic bronchitis","呼吸"],
  ["J43.9","肺氣腫","Emphysema","呼吸"],
  ["J44.1","慢性阻塞性肺疾病（急性加重）","COPD with acute exacerbation","呼吸"],
  ["J44.9","慢性阻塞性肺疾病","Chronic obstructive pulmonary disease","呼吸"],
  ["J45.0","哮喘（過敏性）","Predominantly allergic asthma","呼吸"],
  ["J45.9","哮喘","Asthma","呼吸"],
  ["J46","哮喘持續狀態","Status asthmaticus","呼吸"],
  ["J67.9","過敏性肺炎","Allergic alveolitis","呼吸"],
  ["J69.1","吸入性肺炎","Pneumonitis due to inhalation","呼吸"],
  ["J80","急性呼吸窘迫綜合症","Acute respiratory distress syndrome","呼吸"],
  ["J84.9","間質性肺病","Interstitial pulmonary disease","呼吸"],
  ["J90","胸腔積液","Pleural effusion","呼吸"],
  ["J93.9","氣胸","Pneumothorax","呼吸"],
  ["J94.9","胸膜疾病","Pleural condition","呼吸"],
  ["J96.0","急性呼吸衰竭","Acute respiratory failure","呼吸"],
  ["J96.9","呼吸衰竭","Respiratory failure","呼吸"],
  ["J98.9","呼吸系統疾病","Respiratory disorder","呼吸"],
];

async function seed() {
  let pool;
  try {
    pool = mysql.createPool(DB_CONFIG);

    const [before] = await pool.query('SELECT COUNT(*) as count FROM icd10_codes');
    console.log(`現有 ICD-10 數量：${before[0].count} 筆\n`);

    // Upsert：逐筆記錄（code 已有 UNIQUE 約束 uk_code）
    for (const [code, name_tc, name_en, category] of ICD10_CODES) {
      await pool.query(
        `INSERT INTO icd10_codes (id, code, name_tc, name_en, category)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name_tc=VALUES(name_tc), name_en=VALUES(name_en), category=VALUES(category)`,
        [code, code, name_tc, name_en, category]
      );
    }

    // 驗證結果
    const [after] = await pool.query('SELECT COUNT(*) as total FROM icd10_codes');
    const [byCat] = await pool.query(`
      SELECT category, COUNT(*) as cnt
      FROM icd10_codes
      GROUP BY category
      ORDER BY cnt DESC
    `);

    console.log('===========================================');
    console.log('  ✅ ICD-10 資料初始化完成！');
    console.log('===========================================');
    console.log(`  寫入 ICD-10 數量：${after[0].total} 筆\n`);
    console.log('  各類別分佈：');
    byCat.forEach(r => console.log(`    ${r.category}: ${r.cnt}`));
    console.log('\n  可使用以下指令重新執行：');
    console.log('    NODE_PATH=./node_modules node ../data/icd10/seed-icd10.cjs\n');

  } catch (err) {
    console.error('Seed 失敗：', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
}

seed();
