# Telugu Domain Expansion Plan

## Overview

**Objective**: Implement FR19-FR21 (Domain Expansion) with news, government, and literature datasets while avoiding training bias towards the existing 82K TeQuAD samples.

**Approach**: 3-phase implementation using data collection, QA generation with augmentation, and adapter-based transfer learning with curriculum learning.

**Target**: 20-25K domain-specific QA pairs across 3 domains with balanced training.

---

## Phase 1: Domain Data Collection (Week 1-2)

### Step 1.1 - Download Existing Datasets

| Dataset | Source | Content | Size |
|---------|--------|---------|------|
| AI4Bharat Sangraha | HuggingFace | Telugu corpus | 3.7B tokens |
| Telugu News | Kaggle | Andhra Jyothi articles | ~10K articles |
| AI4Bharat IndicQA | HuggingFace | Telugu QA pairs | ~1K pairs |
| Telugu Books | Kaggle | Novels from TeluguOne | 500 novels |

**Kaggle API Token**: `KGAT_54825c19fe7d9960e88ddc029832e6e9`

### Step 1.2 - Scrape Additional Domain Content

| Domain | Sources | Target Volume |
|--------|---------|---------------|
| News | Sakshi, Andhra Jyothi, Namaste Telangana | 5,000 articles |
| Government | telangana.gov.in, ap.gov.in press releases | 2,000 documents |
| Literature | Wikisource Telugu, TeluguOne | 1,000 passages |

### Step 1.3 - Scripts to Create

```
scripts/data_collection/
├── download_kaggle.py        # Kaggle API integration
├── scrape_news.py            # News scraping (Sakshi, Andhra Jyothi)
├── scrape_government.py      # AP/TS govt portal scraping
└── collect_literature.py     # Wikisource Telugu, literature sources
```

**Scraping Priority (by HTML cleanliness)**:
1. HIGH - Sakshi, Andhra Jyothi, Namaste Telangana
2. MEDIUM - Eenadu, TV9 Telugu (JS-heavy)
3. Government portals - bilingual content (Telugu + English)

---

## Phase 2: QA Pair Generation & Augmentation (Week 3-4)

### Step 2.1 - Question Generation Pipeline

```
Context paragraphs 
    → NER (identify answer candidates)
    → mT5/IndicBART Question Generation
    → Answer extraction verification
    → Round-trip consistency check
    → Quality filtering
```

### Step 2.2 - Data Augmentation Techniques

| Technique | Description | Multiplier |
|-----------|-------------|------------|
| Back-translation | Telugu→English→Telugu via IndicTrans2 | 2x |
| Paraphrasing | IndicBART paraphrase generation | 1.5x |
| Entity swapping | Replace entities with similar types | 1.3x |
| Question template variation | Reformulate question types | 1.5x |

### Step 2.3 - Target QA Pairs

| Domain | Raw Contexts | Generated QA Pairs |
|--------|--------------|-------------------|
| News | 5,000 | 10,000 |
| Government | 2,000 | 5,000 |
| Literature | 1,000 | 5,000 |
| **Total** | **8,000** | **20,000** |

### Step 2.4 - Scripts to Create

```
scripts/qa_generation/
├── question_generator.py     # mT5-based question generation
├── answer_extractor.py       # NER + span extraction
└── quality_filter.py         # Round-trip consistency check

scripts/augmentation/
├── back_translate.py         # IndicTrans2 augmentation
├── paraphrase.py             # IndicBART paraphrasing
└── entity_swap.py            # Entity replacement
```

---

## Phase 3: Bias-Free Transfer Learning (Week 5-6)

### The Challenge

TeQuAD has 82K samples vs ~20K domain samples = **4:1 imbalance**

If trained naively, model will be biased towards Wikipedia-style content.

### Solution: Adapter-Based Domain Adaptation + Curriculum Learning

### Step 3.1 - Domain-Adaptive Continued Pre-training

```python
# Continue pre-training MuRIL on domain text (no QA labels)
# This teaches domain vocabulary and patterns
domain_texts = [news_corpus, govt_corpus, literature_corpus]
continued_pretrain(muril_checkpoint, domain_texts, epochs=2)
```

### Step 3.2 - LoRA Adapter Training

```python
# Freeze base MuRIL, train lightweight adapters per domain
adapters = {
    "news": LoRA(rank=16),
    "government": LoRA(rank=16), 
    "literature": LoRA(rank=16)
}
# Each adapter is small (~4MB) vs full model (~1GB)
```

**Why adapters?**
- Keeps base MuRIL intact (no TeQuAD regression)
- Separate domain expertise without interference
- Fast inference with domain routing

### Step 3.3 - Balanced Training Curriculum

```
Stage 1: Domain-only training (3 epochs)
   └── Train ONLY on news + govt + literature QA
   └── No TeQuAD - establish domain patterns first
   
Stage 2: Mixed training with upsampling (2 epochs)
   └── Domain data: 50% (upsampled 2x)
   └── TeQuAD: 50% (downsampled to 20K)
   
Stage 3: Full data with difficulty weighting (2 epochs)
   └── All data included
   └── Weight harder domain examples higher
   └── Use loss-based example weighting
```

### Step 3.4 - Domain Routing at Inference

```python
def predict_with_domain_routing(context, question):
    domain = classify_domain(context)  # news/govt/literature/general
    
    if domain == "news":
        return qa_engine.predict(context, question, adapter="news")
    elif domain == "government":
        return qa_engine.predict(context, question, adapter="government")
    elif domain == "literature":
        return qa_engine.predict(context, question, adapter="literature")
    else:
        return qa_engine.predict(context, question)  # Base MuRIL
```

### Step 3.5 - Scripts to Create

```
scripts/training/
├── continued_pretrain.py     # Domain-adaptive pretraining
├── adapter_training.py       # LoRA adapter training
├── curriculum_trainer.py     # Balanced curriculum implementation
└── domain_classifier.py      # Domain routing classifier
```

---

## Phase 4: Domain-Wise Evaluation (Week 7)

### Step 4.1 - Create Domain Test Sets

| Domain | Test Set Size | Source |
|--------|---------------|--------|
| News | 500 QA pairs | Held out from generated |
| Government | 300 QA pairs | Held out from generated |
| Literature | 200 QA pairs | Held out from generated |
| Mixed | 200 QA pairs | Cross-domain samples |

### Step 4.2 - Evaluation Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| EM (Exact Match) | >60% per domain | Standard QA metric |
| F1 Score | >75% per domain | Token overlap metric |
| Domain F1 Gap | <5% vs TeQuAD | Fairness across domains |
| TeQuAD Regression | <2% drop | Ensure no forgetting |

### Step 4.3 - Evaluation Commands

```bash
# Per-domain evaluation
python scripts/evaluate_model.py --adapter news --test-split domain_news
python scripts/evaluate_model.py --adapter government --test-split domain_govt
python scripts/evaluate_model.py --adapter literature --test-split domain_lit

# Cross-domain evaluation
python scripts/evaluate_model.py --test-split domain_mixed

# TeQuAD regression check
python scripts/evaluate_model.py --test-split tequad_test
```

---

## Directory Structure

```
telugu-qa-system/
├── scripts/
│   ├── data_collection/
│   │   ├── download_kaggle.py
│   │   ├── scrape_news.py
│   │   ├── scrape_government.py
│   │   └── collect_literature.py
│   ├── qa_generation/
│   │   ├── question_generator.py
│   │   ├── answer_extractor.py
│   │   └── quality_filter.py
│   ├── augmentation/
│   │   ├── back_translate.py
│   │   ├── paraphrase.py
│   │   └── entity_swap.py
│   └── training/
│       ├── continued_pretrain.py
│       ├── adapter_training.py
│       ├── curriculum_trainer.py
│       └── domain_classifier.py
├── data/
│   └── domain/
│       ├── news/
│       │   ├── raw/
│       │   ├── qa_pairs/
│       │   └── test/
│       ├── government/
│       │   ├── raw/
│       │   ├── qa_pairs/
│       │   └── test/
│       └── literature/
│           ├── raw/
│           ├── qa_pairs/
│           └── test/
└── models/
    └── adapters/
        ├── news/
        ├── government/
        └── literature/
```

---

## Key Decisions

1. **Adapter vs Full Fine-tuning**: Chose LoRA adapters
   - Keeps base MuRIL intact
   - Avoids catastrophic forgetting of TeQuAD
   - Enables domain-specific routing
   - Small storage footprint (~4MB per adapter)

2. **Domain-first curriculum**: Train on domain data FIRST
   - Establishes domain patterns before larger dataset dominates
   - Prevents TeQuAD bias

3. **Question generation over manual annotation**: Using mT5 QG
   - Faster and scalable
   - Quality filtering ensures usable pairs
   - Can generate 10x more pairs than manual annotation

4. **Scraping priority**: Focus on clean HTML sources
   - Sakshi, Andhra Jyothi have cleanest structure
   - Government portals are bilingual (extract Telugu sections)

---

## Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| AI4Bharat Sangraha | huggingface.co/datasets/ai4bharat/sangraha | Large Telugu corpus |
| IndicQA | huggingface.co/datasets/ai4bharat/IndicQA | QA benchmark |
| Telugu News | Kaggle telugu_news | News classification |
| IndicTrans2 | ai4bharat/IndicTrans2 | Back-translation |
| IndicBART | ai4bharat/IndicBART | Paraphrasing, QG |

---

## Timeline Summary

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1-2 | Data Collection | Raw domain data (8K+ contexts) |
| 3-4 | QA Generation | 20K domain QA pairs |
| 5-6 | Transfer Learning | Domain adapters trained |
| 7 | Evaluation | Domain test results, FR19-21 complete |

---

## Verification Checklist

- [ ] News domain: 10K QA pairs generated
- [ ] Government domain: 5K QA pairs generated
- [ ] Literature domain: 5K QA pairs generated
- [ ] News adapter trained (EM >60%, F1 >75%)
- [ ] Government adapter trained (EM >60%, F1 >75%)
- [ ] Literature adapter trained (EM >60%, F1 >75%)
- [ ] Domain routing working in inference
- [ ] TeQuAD performance unchanged (<2% drop)
- [ ] FR19 (news domain) complete
- [ ] FR20 (government domain) complete
- [ ] FR21 (domain-wise evaluation) complete
