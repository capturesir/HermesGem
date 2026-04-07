/**
 * 醫藥資料初始化 Script
 *
 * 用途：將藥物資料寫入 MySQL medications 表
 * 使用方式：node data/medications/seed-medications.js
 *
 * 獨立執行，無需其他依賴
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'clinic123',
  database: process.env.DB_NAME || 'simple_medical_db',
};

// 藥物資料陣列（可替換為 JSON 檔案：data/medications/medications.json）
const MEDICATIONS = [
  // ===== 止痛/退燒 =====
  { name: "撲熱息痛", generic_name: "Acetaminophen/Paracetamol", dosage: "500mg", route: "oral" },
  { name: "布洛芬", generic_name: "Ibuprofen", dosage: "200mg", route: "oral" },
  { name: "布洛芬", generic_name: "Ibuprofen", dosage: "400mg", route: "oral" },
  { name: "阿司匹林", generic_name: "Aspirin", dosage: "100mg", route: "oral" },
  { name: "阿司匹林", generic_name: "Aspirin", dosage: "300mg", route: "oral" },
  { name: "萘普生", generic_name: "Naproxen", dosage: "250mg", route: "oral" },
  { name: "雙氯芬酸鈉", generic_name: "Diclofenac Sodium", dosage: "25mg", route: "oral" },
  { name: "曲馬多", generic_name: "Tramadol", dosage: "50mg", route: "oral" },
  { name: "可待因", generic_name: "Codeine Phosphate", dosage: "15mg", route: "oral" },
  { name: "嗎啡", generic_name: "Morphine", dosage: "10mg", route: "oral" },
  { name: "加巴噴丁", generic_name: "Gabapentin", dosage: "300mg", route: "oral" },
  { name: "普瑞巴林", generic_name: "Pregabalin", dosage: "75mg", route: "oral" },

  // ===== 胃腸道 =====
  { name: "奧美拉唑", generic_name: "Omeprazole", dosage: "20mg", route: "oral" },
  { name: "奧美拉唑", generic_name: "Omeprazole", dosage: "40mg", route: "oral" },
  { name: "蘭索拉唑", generic_name: "Lansoprazole", dosage: "30mg", route: "oral" },
  { name: "泮托拉唑", generic_name: "Pantoprazole", dosage: "40mg", route: "oral" },
  { name: "法莫替丁", generic_name: "Famotidine", dosage: "20mg", route: "oral" },
  { name: "雷尼替丁", generic_name: "Ranitidine", dosage: "150mg", route: "oral" },
  { name: "氫氧化鋁凝膠", generic_name: "Aluminum Hydroxide Gel", dosage: "10ml", route: "oral" },
  { name: "蒙脫石散", generic_name: "Montmorillonite Powder (Smecta)", dosage: "3g", route: "oral" },
  { name: "洛哌丁胺", generic_name: "Loperamide", dosage: "2mg", route: "oral" },
  { name: "地芬諾酯", generic_name: "Diphenoxylate", dosage: "2.5mg", route: "oral" },
  { name: "布拉氏酵母菌", generic_name: "Saccharomyces boulardii", dosage: "250mg", route: "oral" },
  { name: "乳果糖", generic_name: "Lactulose", dosage: "10g", route: "oral" },
  { name: "比沙可啶", generic_name: "Bisacodyl", dosage: "5mg", route: "oral" },
  { name: "聚乙二醇", generic_name: "Macrogol/PEG", dosage: "10g", route: "oral" },
  { name: "多潘立酮", generic_name: "Domperidone", dosage: "10mg", route: "oral" },
  { name: "甲氧氯普胺", generic_name: "Metoclopramide", dosage: "10mg", route: "oral" },

  // ===== 抗生素 =====
  { name: "阿莫西林", generic_name: "Amoxicillin", dosage: "250mg", route: "oral" },
  { name: "阿莫西林", generic_name: "Amoxicillin", dosage: "500mg", route: "oral" },
  { name: "克拉黴素", generic_name: "Clarithromycin", dosage: "250mg", route: "oral" },
  { name: "克拉黴素", generic_name: "Clarithromycin", dosage: "500mg", route: "oral" },
  { name: "阿奇黴素", generic_name: "Azithromycin", dosage: "250mg", route: "oral" },
  { name: "阿奇黴素", generic_name: "Azithromycin", dosage: "500mg", route: "oral" },
  { name: "頭孢呋辛", generic_name: "Cefuroxime Axetil", dosage: "250mg", route: "oral" },
  { name: "頭孢克肟", generic_name: "Cefixime", dosage: "100mg", route: "oral" },
  { name: "頭孢克肟", generic_name: "Cefixime", dosage: "200mg", route: "oral" },
  { name: "左氧氟沙星", generic_name: "Levofloxacin", dosage: "250mg", route: "oral" },
  { name: "左氧氟沙星", generic_name: "Levofloxacin", dosage: "500mg", route: "oral" },
  { name: "莫西沙星", generic_name: "Moxifloxacin", dosage: "400mg", route: "oral" },
  { name: "環丙沙星", generic_name: "Ciprofloxacin", dosage: "250mg", route: "oral" },
  { name: "環丙沙星", generic_name: "Ciprofloxacin", dosage: "500mg", route: "oral" },
  { name: "甲硝唑", generic_name: "Metronidazole", dosage: "200mg", route: "oral" },
  { name: "甲硝唑", generic_name: "Metronidazole", dosage: "400mg", route: "oral" },
  { name: "替硝唑", generic_name: "Tinidazole", dosage: "500mg", route: "oral" },
  { name: "多西環素", generic_name: "Doxycycline", dosage: "100mg", route: "oral" },
  { name: "四環素", generic_name: "Tetracycline", dosage: "250mg", route: "oral" },
  { name: "磷黴素", generic_name: "Fosfomycin", dosage: "3g", route: "oral" },
  { name: "利福平", generic_name: "Rifampicin", dosage: "300mg", route: "oral" },
  { name: "阿莫西林克拉維酸", generic_name: "Amoxicillin/Clavulanate", dosage: "375mg", route: "oral" },
  { name: "阿莫西林克拉維酸", generic_name: "Amoxicillin/Clavulanate", dosage: "625mg", route: "oral" },

  // ===== 抗病毒 =====
  { name: "利巴韋林", generic_name: "Ribavirin", dosage: "200mg", route: "oral" },
  { name: "奧司他韋", generic_name: "Oseltamivir", dosage: "75mg", route: "oral" },
  { name: "金剛烷胺", generic_name: "Amantadine", dosage: "100mg", route: "oral" },
  { name: "干擾素α", generic_name: "Interferon Alpha", dosage: "可變", route: "injection" },
  { name: "恩替卡韋", generic_name: "Entecavir", dosage: "0.5mg", route: "oral" },
  { name: "替比夫定", generic_name: "Telbivudine", dosage: "600mg", route: "oral" },
  { name: "阿德福韋酯", generic_name: "Adefovir Dipivoxil", dosage: "10mg", route: "oral" },
  { name: "索非布韋", generic_name: "Sofosbuvir", dosage: "400mg", route: "oral" },
  { name: "達卡他韋", generic_name: "Daclatasvir", dosage: "60mg", route: "oral" },

  // ===== 抗真菌 =====
  { name: "氟康唑", generic_name: "Fluconazole", dosage: "50mg", route: "oral" },
  { name: "氟康唑", generic_name: "Fluconazole", dosage: "150mg", route: "oral" },
  { name: "伊曲康唑", generic_name: "Itraconazole", dosage: "100mg", route: "oral" },
  { name: "伏立康唑", generic_name: "Voriconazole", dosage: "200mg", route: "oral" },
  { name: "兩性黴素B", generic_name: "Amphotericin B", dosage: "可變", route: "injection" },
  { name: "灰黴素", generic_name: "Griseofulvin", dosage: "125mg", route: "oral" },
  { name: "酮康唑", generic_name: "Ketoconazole", dosage: "200mg", route: "oral" },

  // ===== 心血管 =====
  { name: "氨氯地平", generic_name: "Amlodipine", dosage: "5mg", route: "oral" },
  { name: "氨氯地平", generic_name: "Amlodipine", dosage: "10mg", route: "oral" },
  { name: "硝苯地平", generic_name: "Nifedipine", dosage: "10mg", route: "oral" },
  { name: "硝苯地平緩釋片", generic_name: "Nifedipine SR", dosage: "20mg", route: "oral" },
  { name: "美托洛爾", generic_name: "Metoprolol", dosage: "25mg", route: "oral" },
  { name: "美托洛爾", generic_name: "Metoprolol", dosage: "50mg", route: "oral" },
  { name: "美托洛爾", generic_name: "Metoprolol", dosage: "100mg", route: "oral" },
  { name: "比索洛爾", generic_name: "Bisoprolol", dosage: "5mg", route: "oral" },
  { name: "比索洛爾", generic_name: "Bisoprolol", dosage: "10mg", route: "oral" },
  { name: "卡維地洛", generic_name: "Carvedilol", dosage: "12.5mg", route: "oral" },
  { name: "雷米普利", generic_name: "Ramipril", dosage: "2.5mg", route: "oral" },
  { name: "雷米普利", generic_name: "Ramipril", dosage: "5mg", route: "oral" },
  { name: "培哚普利", generic_name: "Perindopril", dosage: "4mg", route: "oral" },
  { name: "厄貝沙坦", generic_name: "Irbesartan", dosage: "150mg", route: "oral" },
  { name: "厄貝沙坦", generic_name: "Irbesartan", dosage: "300mg", route: "oral" },
  { name: "氯沙坦", generic_name: "Losartan", dosage: "50mg", route: "oral" },
  { name: "纈沙坦", generic_name: "Valsartan", dosage: "80mg", route: "oral" },
  { name: "氫氯噻嗪", generic_name: "Hydrochlorothiazide", dosage: "25mg", route: "oral" },
  { name: "呋塞米", generic_name: "Furosemide", dosage: "20mg", route: "oral" },
  { name: "螺內酯", generic_name: "Spironolactone", dosage: "20mg", route: "oral" },
  { name: "地高辛", generic_name: "Digoxin", dosage: "0.25mg", route: "oral" },
  { name: "胺碘酮", generic_name: "Amiodarone", dosage: "200mg", route: "oral" },
  { name: "硝酸甘油", generic_name: "Nitroglycerin", dosage: "0.5mg", route: "oral" },
  { name: "單硝酸異山梨酯", generic_name: "Isosorbide Mononitrate", dosage: "20mg", route: "oral" },
  { name: "阿托伐他汀", generic_name: "Atorvastatin", dosage: "10mg", route: "oral" },
  { name: "阿托伐他汀", generic_name: "Atorvastatin", dosage: "20mg", route: "oral" },
  { name: "阿托伐他汀", generic_name: "Atorvastatin", dosage: "40mg", route: "oral" },
  { name: "辛伐他汀", generic_name: "Simvastatin", dosage: "20mg", route: "oral" },
  { name: "瑞舒伐他汀", generic_name: "Rosuvastatin", dosage: "10mg", route: "oral" },
  { name: "依折麥布", generic_name: "Ezetimibe", dosage: "10mg", route: "oral" },

  // ===== 內分泌/糖尿病 =====
  { name: "二甲雙胍", generic_name: "Metformin", dosage: "500mg", route: "oral" },
  { name: "二甲雙胍", generic_name: "Metformin", dosage: "850mg", route: "oral" },
  { name: "格列本脲", generic_name: "Glibenclamide", dosage: "5mg", route: "oral" },
  { name: "格列齊特", generic_name: "Gliclazide", dosage: "80mg", route: "oral" },
  { name: "格列吡嗪", generic_name: "Glipizide", dosage: "5mg", route: "oral" },
  { name: "瑞格列奈", generic_name: "Repaglinide", dosage: "1mg", route: "oral" },
  { name: "沙格列汀", generic_name: "Saxagliptin", dosage: "5mg", route: "oral" },
  { name: "維格列汀", generic_name: "Vildagliptin", dosage: "50mg", route: "oral" },
  { name: "胰島素（短效）", generic_name: "Insulin (Regular)", dosage: "可變", route: "injection" },
  { name: "胰島素（預混）", generic_name: "Insulin (Pre-mixed)", dosage: "可變", route: "injection" },
  { name: "甘精胰島素", generic_name: "Insulin Glargine", dosage: "可變", route: "injection" },
  { name: "甲狀腺片", generic_name: "Thyroid Tablets", dosage: "40mg", route: "oral" },
  { name: "左甲狀腺素鈉", generic_name: "Levothyroxine Sodium", dosage: "50mcg", route: "oral" },
  { name: "甲亢平", generic_name: "Carbimazole", dosage: "5mg", route: "oral" },
  { name: "丙硫氧嘧啶", generic_name: "Propylthiouracil", dosage: "50mg", route: "oral" },

  // ===== 呼吸系統 =====
  { name: "沙丁胺醇氣霧劑", generic_name: "Salbutamol Inhaler", dosage: "100mcg/dose", route: "inhalation" },
  { name: "沙丁胺醇霧化液", generic_name: "Salbutamol Nebule", dosage: "2.5mg", route: "inhalation" },
  { name: "特布他林", generic_name: "Terbutaline", dosage: "5mg", route: "oral" },
  { name: "氟替卡鬆吸入劑", generic_name: "Fluticasone Inhaler", dosage: "125mcg/dose", route: "inhalation" },
  { name: "氟替卡鬆+沙美特羅", generic_name: "Fluticasone/Salmeterol", dosage: "250/50mcg", route: "inhalation" },
  { name: "布地奈德霧化液", generic_name: "Budesonide Nebule", dosage: "0.5mg", route: "inhalation" },
  { name: "異丙托溴銨霧化液", generic_name: "Ipratropium Bromide Nebule", dosage: "500mcg", route: "inhalation" },
  { name: "孟魯司特鈉", generic_name: "Montelukast Sodium", dosage: "10mg", route: "oral" },
  { name: "氨茶鹼", generic_name: "Aminophylline", dosage: "100mg", route: "oral" },
  { name: "多索茶鹼", generic_name: "Doxofylline", dosage: "400mg", route: "oral" },
  { name: "福爾可定", generic_name: "Pholcodine", dosage: "5mg", route: "oral" },
  { name: "右美沙芬", generic_name: "Dextromethorphan", dosage: "15mg", route: "oral" },
  { name: "愈創木酚甘油醚", generic_name: "Guaifenesin", dosage: "100mg", route: "oral" },
  { name: "鹽酸溴己新", generic_name: "Bromhexine HCl", dosage: "8mg", route: "oral" },
  { name: "乙酰半胱氨酸", generic_name: "Acetylcysteine", dosage: "200mg", route: "oral" },

  // ===== 抗過敏/免疫 =====
  { name: "氯苯那敏", generic_name: "Chlorpheniramine", dosage: "4mg", route: "oral" },
  { name: "氯雷他定", generic_name: "Loratadine", dosage: "10mg", route: "oral" },
  { name: "西替利嗪", generic_name: "Cetirizine", dosage: "10mg", route: "oral" },
  { name: "地氯雷他定", generic_name: "Desloratadine", dosage: "5mg", route: "oral" },
  { name: "左西替利嗪", generic_name: "Levocetirizine", dosage: "5mg", route: "oral" },
  { name: "非索非那定", generic_name: "Fexofenadine", dosage: "60mg", route: "oral" },
  { name: "氫化可的鬆乳膏", generic_name: "Hydrocortisone Cream", dosage: "1%", route: "topical" },
  { name: "氟輕鬆乳膏", generic_name: "Fluocinonide Cream", dosage: "0.05%", route: "topical" },
  { name: "莫米松乳膏", generic_name: "Mometasone Cream", dosage: "0.1%", route: "topical" },
  { name: "爐甘石洗劑", generic_name: "Calamine Lotion", dosage: "外用", route: "topical" },
  { name: "鹽酸苯海拉明", generic_name: "Diphenhydramine HCl", dosage: "25mg", route: "oral" },
  { name: "潑尼松龍", generic_name: "Prednisolone", dosage: "5mg", route: "oral" },
  { name: "潑尼松龍", generic_name: "Prednisolone", dosage: "20mg", route: "oral" },
  { name: "地塞米松", generic_name: "Dexamethasone", dosage: "0.5mg", route: "oral" },

  // ===== 精神科/神經科 =====
  { name: "阿普唑侖", generic_name: "Alprazolam", dosage: "0.25mg", route: "oral" },
  { name: "阿普唑侖", generic_name: "Alprazolam", dosage: "0.5mg", route: "oral" },
  { name: "氯硝西泮", generic_name: "Clonazepam", dosage: "0.5mg", route: "oral" },
  { name: "地西泮", generic_name: "Diazepam", dosage: "2mg", route: "oral" },
  { name: "地西泮", generic_name: "Diazepam", dosage: "5mg", route: "oral" },
  { name: "勞拉西泮", generic_name: "Lorazepam", dosage: "1mg", route: "oral" },
  { name: "舍曲林", generic_name: "Sertraline", dosage: "50mg", route: "oral" },
  { name: "氟西汀", generic_name: "Fluoxetine", dosage: "20mg", route: "oral" },
  { name: "帕羅西汀", generic_name: "Paroxetine", dosage: "20mg", route: "oral" },
  { name: "艾司西酞普蘭", generic_name: "Escitalopram", dosage: "10mg", route: "oral" },
  { name: "文拉法辛", generic_name: "Venlafaxine", dosage: "75mg", route: "oral" },
  { name: "度洛西汀", generic_name: "Duloxetine", dosage: "30mg", route: "oral" },
  { name: "米氮平", generic_name: "Mirtazapine", dosage: "15mg", route: "oral" },
  { name: "曲唑酮", generic_name: "Trazodone", dosage: "50mg", route: "oral" },
  { name: "安非他酮", generic_name: "Bupropion", dosage: "150mg", route: "oral" },
  { name: "思瑞康", generic_name: "Quetiapine", dosage: "25mg", route: "oral" },
  { name: "利培酮", generic_name: "Risperidone", dosage: "1mg", route: "oral" },
  { name: "奧氮平", generic_name: "Olanzapine", dosage: "5mg", route: "oral" },
  { name: "碳酸鋰", generic_name: "Lithium Carbonate", dosage: "250mg", route: "oral" },
  { name: "丙戊酸鈉", generic_name: "Sodium Valproate", dosage: "200mg", route: "oral" },
  { name: "卡馬西平", generic_name: "Carbamazepine", dosage: "100mg", route: "oral" },
  { name: "丙戊酸鈉", generic_name: "Sodium Valproate", dosage: "500mg", route: "oral" },
  { name: "苯巴比妥", generic_name: "Phenobarbital", dosage: "30mg", route: "oral" },
  { name: "苯妥英鈉", generic_name: "Phenytoin Sodium", dosage: "100mg", route: "oral" },
  { name: "左乙拉西坦", generic_name: "Levetiracetam", dosage: "500mg", route: "oral" },
  { name: "托吡酯", generic_name: "Topiramate", dosage: "25mg", route: "oral" },
  { name: "氯硝西泮", generic_name: "Clonazepam", dosage: "2mg", route: "oral" },

  // ===== 泌尿/腎科 =====
  { name: "坦索羅辛", generic_name: "Tamsulosin", dosage: "0.2mg", route: "oral" },
  { name: "非那雄胺", generic_name: "Finasteride", dosage: "5mg", route: "oral" },
  { name: "度他雄胺", generic_name: "Dutasteride", dosage: "0.5mg", route: "oral" },
  { name: "托特羅定", generic_name: "Tolterodine", dosage: "2mg", route: "oral" },
  { name: "索利那新", generic_name: "Solifenacin", dosage: "5mg", route: "oral" },

  // ===== 婦科 =====
  { name: "炔雌醇", generic_name: "Ethinylestradiol", dosage: "0.03mg", route: "oral" },
  { name: "左炔諾孕酮", generic_name: "Levonorgestrel", dosage: "0.75mg", route: "oral" },
  { name: "甲羥孕酮", generic_name: "Medroxyprogesterone Acetate", dosage: "5mg", route: "oral" },
  { name: "米非司酮", generic_name: "Mifepristone", dosage: "200mg", route: "oral" },
  { name: "雪若酮", generic_name: "Chlormadinone", dosage: "2mg", route: "oral" },

  // ===== 眼科/耳鼻喉 =====
  { name: "氯化鈉滴眼液", generic_name: "Sodium Chloride Eye Drops", dosage: "3%", route: "topical" },
  { name: "人工淚液", generic_name: "Artificial Tears", dosage: "外用", route: "topical" },
  { name: "氟米龍滴眼液", generic_name: "Fluorometholone Eye Drops", dosage: "0.1%", route: "topical" },
  { name: "氧氟沙星滴眼液", generic_name: "Ofloxacin Eye Drops", dosage: "0.3%", route: "topical" },
  { name: "阿奇黴素滴眼液", generic_name: "Azithromycin Eye Drops", dosage: "1%", route: "topical" },
  { name: "重組牛鹼性成纖維細胞生長因子滴眼液", generic_name: "r-bFGF Eye Drops", dosage: "外用", route: "topical" },
  { name: "氫氯噻嗪", generic_name: "Hydrochlorothiazide", dosage: "25mg", route: "oral" },
  { name: "紅黴素軟膏", generic_name: "Erythromycin Ointment", dosage: "0.5%", route: "topical" },
  { name: "莫匹羅星軟膏", generic_name: "Mupirocin Ointment", dosage: "2%", route: "topical" },
  { name: "氧氟沙星滴耳液", generic_name: "Ofloxacin Ear Drops", dosage: "0.3%", route: "topical" },
  { name: "苯酚甘油滴耳液", generic_name: "Phenol Glycerin Ear Drops", dosage: "外用", route: "topical" },

  // ===== 維生素/營養/補鐵 =====
  { name: "維生素B1", generic_name: "Vitamin B1 (Thiamine)", dosage: "10mg", route: "oral" },
  { name: "維生素B2", generic_name: "Vitamin B2 (Riboflavin)", dosage: "10mg", route: "oral" },
  { name: "維生素B6", generic_name: "Vitamin B6 (Pyridoxine)", dosage: "10mg", route: "oral" },
  { name: "維生素B12", generic_name: "Vitamin B12 (Cyanocobalamin)", dosage: "500mcg", route: "oral" },
  { name: "維生素C", generic_name: "Vitamin C (Ascorbic Acid)", dosage: "100mg", route: "oral" },
  { name: "維生素D3", generic_name: "Vitamin D3 (Cholecalciferol)", dosage: "400IU", route: "oral" },
  { name: "維生素D3", generic_name: "Vitamin D3 (Cholecalciferol)", dosage: "800IU", route: "oral" },
  { name: "鈣爾奇D", generic_name: "Calcium + Vitamin D", dosage: "600mg/400IU", route: "oral" },
  { name: "葡萄糖酸鈣鋅", generic_name: "Calcium + Zinc Gluconate", dosage: "可變", route: "oral" },
  { name: "硫酸亞鐵", generic_name: "Ferrous Sulfate", dosage: "300mg", route: "oral" },
  { name: "多糖鐵複合膠囊", generic_name: "Polysaccharide Iron Complex", dosage: "150mg", route: "oral" },
  { name: "葉酸", generic_name: "Folic Acid", dosage: "5mg", route: "oral" },
  { name: "葡萄糖酸鋅", generic_name: "Zinc Gluconate", dosage: "10mg", route: "oral" },
  { name: "氯化鉀", generic_name: "Potassium Chloride", dosage: "1g", route: "oral" },
  { name: "硫酸鎂", generic_name: "Magnesium Sulfate", dosage: "可變", route: "oral" },
  { name: "α-硫辛酸", generic_name: "Alpha Lipoic Acid", dosage: "600mg", route: "oral" },
];

async function seed() {
  console.log('===========================================');
  console.log('  醫藥資料初始化 Script');
  console.log('===========================================\n');

  console.log('資料庫設定：');
  console.log(`  Host:     ${DB_CONFIG.host}`);
  console.log(`  Database: ${DB_CONFIG.database}`);
  console.log(`  Table:    medications`);
  console.log(`  藥物數量: ${MEDICATIONS.length} 筆\n`);

  const pool = mysql.createPool(DB_CONFIG);

  try {
    // 確認資料表存在
    const [tables] = await pool.query("SHOW TABLES LIKE 'medications'");
    if (tables.length === 0) {
      console.error('錯誤：medications 資料表不存在');
      process.exit(1);
    }

    // 讀取現有數量
    const [before] = await pool.query('SELECT COUNT(*) as count FROM medications');
    console.log(`現有藥物數量：${before[0].count} 筆`);

    // 確保資料表存在（第一次執行時自動建立）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medications (
        id         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        name       VARCHAR(100) NOT NULL,
        generic_name VARCHAR(100) DEFAULT NULL,
        dosage     VARCHAR(50)  DEFAULT NULL,
        route      VARCHAR(50)  DEFAULT NULL,
        created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_medication (name, generic_name, dosage, route)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 清除舊數據（TRUNCATE = 截断後重新插入，每次執行結果一致）
    await pool.query('TRUNCATE TABLE medications');
    console.log('已截斷現有藥物資料（準備重新插入）\n');

    // 批次插入（VALUES 多行一次寫入，效率更高）
    const values = MEDICATIONS.map(med =>
      [med.name, med.generic_name, med.dosage, med.route]
    );
    const placeholders = values.map(() => '(UUID(), ?, ?, ?, ?)').join(',\n');
    const flatParams = values.flat();

    await pool.query(
      `INSERT INTO medications (id, name, generic_name, dosage, route)\nVALUES ${placeholders}`,
      flatParams
    );
    console.log(`已寫入 ${MEDICATIONS.length} 筆藥物資料\n`);

    // 驗證結果
    const [after] = await pool.query('SELECT COUNT(*) as total FROM medications');
    const [byRoute] = await pool.query(`
      SELECT route, COUNT(*) as count 
      FROM medications 
      GROUP BY route 
      ORDER BY count DESC
    `);

    console.log('===========================================');
    console.log('  ✅ 藥物資料初始化完成！');
    console.log('===========================================');
    console.log(`  寫入藥物數量：${after[0].total} 筆`);
    console.log('\n  各給藥途徑分佈：');
    byRoute.forEach(r => console.log(`    ${r.route}: ${r.count}`));
    console.log('\n  可使用 node data/medications/seed-medications.js 重新執行\n');

  } catch (err) {
    console.error('Seed 失敗：', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
