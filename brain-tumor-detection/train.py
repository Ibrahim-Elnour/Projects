import torch
from torch import nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, models, transforms

device = "mps" if torch.backends.mps.is_available() else "cpu"
print("Running on:", device)

# ---------- 1. DATA ----------
# Prepare images the way ResNet saw them during ImageNet pretraining
transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),  # MRI scans are grayscale; ResNet expects 3 channels
    transforms.Resize((224, 224)),                # ResNet's expected input size
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],   # ImageNet normalization
                         [0.229, 0.224, 0.225]),
])

# Expects: data/yes/*.jpg (tumor) and data/no/*.jpg (no tumor)
dataset = datasets.ImageFolder("data", transform=transform)
print("Classes:", dataset.class_to_idx)
print("Total images:", len(dataset))

# 80% train, 20% test (fixed seed so the split is the same every run)
train_size = int(0.8 * len(dataset))
test_size = len(dataset) - train_size
train_set, test_set = random_split(
    dataset, [train_size, test_size], generator=torch.Generator().manual_seed(42)
)
train_loader = DataLoader(train_set, batch_size=16, shuffle=True)
test_loader = DataLoader(test_set, batch_size=16)

# ---------- 2. MODEL ----------
model = models.resnet18(weights="DEFAULT")

# Freeze the pretrained layers so only the new final layer learns
for param in model.parameters():
    param.requires_grad = False

# Swap in a 2-class final layer (trainable by default)
model.fc = nn.Linear(model.fc.in_features, 2)
model = model.to(device)

loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.fc.parameters(), lr=0.001)

# ---------- 3. TRAIN ----------
for epoch in range(10):
    model.train()
    total_loss = 0
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()                  # clear old adjustments
        loss = loss_fn(model(images), labels)  # predict and measure the error
        loss.backward()                        # figure out which weights caused it
        optimizer.step()                       # nudge those weights to reduce it
        total_loss += loss.item()
    print(f"Epoch {epoch + 1}: average loss {total_loss / len(train_loader):.4f}")

# ---------- 4. EVALUATE on images the model never trained on ----------
model.eval()
tumor = dataset.class_to_idx["yes"]
tp = fn = tn = fp = 0

with torch.no_grad():
    for images, labels in test_loader:
        preds = model(images.to(device)).argmax(dim=1).cpu()
        for pred, label in zip(preds, labels):
            if label == tumor:
                if pred == tumor:
                    tp += 1   # tumor, caught it
                else:
                    fn += 1   # tumor, missed it
            else:
                if pred == tumor:
                    fp += 1   # no tumor, false alarm
                else:
                    tn += 1   # no tumor, correctly cleared

total = tp + fn + tn + fp
print(f"\nTest images: {total}")
print(f"Accuracy:    {(tp + tn) / total:.1%}")
print(f"Sensitivity: {tp / max(tp + fn, 1):.1%}  (tumors caught)")
print(f"Specificity: {tn / max(tn + fp, 1):.1%}  (healthy scans correctly cleared)")