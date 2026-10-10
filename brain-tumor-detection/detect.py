from ultralytics import YOLO

model = YOLO("yolov8n.pt")
model.train(data="BrainTumorYolov8/data.yaml", epochs=20, imgsz=640, device="mps")