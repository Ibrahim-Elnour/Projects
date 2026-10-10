# Brain Tumor Detection in MRI Scans

Classifying brain MRI scans with ResNet-18, then localizing tumors with YOLOv8.
<img width="1069" height="455" alt="Validation metrics" src="https://github.com/user-attachments/assets/9563fce5-ac9a-47cf-be75-39454bfaed82" />
<img width="2400" height="1200" alt="Training curves" src="https://github.com/user-attachments/assets/f08b3f1a-557f-4663-bf1e-68c45b58fc9d" />


---

## Part 1: Classification (ResNet-18)
Fine-tuned an ImageNet-pretrained ResNet-18 to classify scans as tumor / no tumor, training only a new final layer. 253 images, 80/20 split, Apple M2 GPU.

| Version | Accuracy | Sensitivity | Specificity |
|---|---|---|---|
| Baseline | ~84% | ~79% | ~97% |
| + Augmentation | ~89% | ~93% | ~81% |

*51 test images, averaged across runs.*

**Training loop** (full script in [`train.py`](train.py)):
```python
model = models.resnet18(weights="DEFAULT")

for param in model.parameters():
    param.requires_grad = False

model.fc = nn.Linear(model.fc.in_features, 2)
model = model.to(device)

loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.fc.parameters(), lr=0.001)

for epoch in range(10):
    model.train()
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        loss = loss_fn(model(images), labels)
        loss.backward()
        optimizer.step()
```

---

## Part 2: Detection (YOLOv8)
Fine-tuned YOLOv8n to draw bounding boxes and classify 3 tumor types (CLASS-0, CLASS-1, CLASS-2). 20 epochs at 640×640, Apple M2 GPU.

| Metric | Validation |
|---|---|
| mAP50 | **89.9%** |
| mAP50-95 | **69.3%** |

<img width="1920" height="1920" alt="YOLOv8 predictions" src="https://github.com/user-attachments/assets/f55a77d0-b18b-421c-a528-da27ff0dc2ea" />

---

## Run It
```bash
pip install torch torchvision ultralytics
python train.py   # ResNet-18 classifier
```
```python
from ultralytics import YOLO
model = YOLO("yolov8n.pt")
model.train(data="BrainTumor/BrainTumorYolov8/data.yaml", epochs=20, imgsz=640, device="mps")
```

---

**Credits:** YOLOv8 dataset by Parisa Karimi Darabi on Kaggle.  
*Educational project, not for clinical use.*
