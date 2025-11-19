"""
Wav2Lip Model Architecture
Neural network for lip synchronization
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class Conv2d(nn.Module):
    """Custom Conv2d with batch normalization and activation"""

    def __init__(
        self,
        cin,
        cout,
        kernel_size,
        stride,
        padding,
        residual=False,
        *args,
        **kwargs
    ):
        super().__init__()
        self.conv_block = nn.Sequential(
            nn.Conv2d(cin, cout, kernel_size, stride, padding),
            nn.BatchNorm2d(cout)
        )
        self.act = nn.ReLU()
        self.residual = residual

    def forward(self, x):
        out = self.conv_block(x)
        if self.residual:
            out += x
        return self.act(out)


class NonNegativeResidualBlock(nn.Module):
    """Residual block with non-negative output"""

    def __init__(self, cin, cout, kernel_size=3, stride=1, padding=1):
        super().__init__()
        self.conv1 = Conv2d(cin, cout, kernel_size, stride, padding, residual=False)
        self.conv2 = Conv2d(cout, cout, kernel_size, 1, padding, residual=True)

    def forward(self, x):
        out = self.conv1(x)
        out = self.conv2(out)
        return out


class FaceEncoder(nn.Module):
    """Encoder for face images"""

    def __init__(self):
        super().__init__()

        # Input: (B, 6, 96, 96) - 6 channels for lower and full face
        self.conv1 = Conv2d(6, 32, kernel_size=7, stride=1, padding=3)

        self.conv2 = Conv2d(32, 64, kernel_size=5, stride=(1, 2), padding=2)
        self.conv3 = Conv2d(64, 64, kernel_size=5, stride=1, padding=2, residual=True)

        self.conv4 = Conv2d(64, 128, kernel_size=3, stride=2, padding=1)
        self.conv5 = Conv2d(128, 128, kernel_size=3, stride=1, padding=1, residual=True)
        self.conv6 = Conv2d(128, 128, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv7 = Conv2d(128, 256, kernel_size=3, stride=2, padding=1)
        self.conv8 = Conv2d(256, 256, kernel_size=3, stride=1, padding=1, residual=True)
        self.conv9 = Conv2d(256, 256, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv10 = Conv2d(256, 512, kernel_size=3, stride=2, padding=1)
        self.conv11 = Conv2d(512, 512, kernel_size=3, stride=1, padding=1, residual=True)
        self.conv12 = Conv2d(512, 512, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv13 = Conv2d(512, 512, kernel_size=3, stride=1, padding=0)
        self.conv14 = Conv2d(512, 512, kernel_size=1, stride=1, padding=0)

    def forward(self, x):
        out = self.conv1(x)

        out = self.conv2(out)
        out = self.conv3(out)

        out = self.conv4(out)
        out = self.conv5(out)
        out = self.conv6(out)

        out = self.conv7(out)
        out = self.conv8(out)
        out = self.conv9(out)

        out = self.conv10(out)
        out = self.conv11(out)
        out = self.conv12(out)

        out = self.conv13(out)
        out = self.conv14(out)

        return out


class AudioEncoder(nn.Module):
    """Encoder for audio mel spectrograms"""

    def __init__(self):
        super().__init__()

        # Input: (B, 1, 80, 16) - mel spectrogram
        self.conv1 = Conv2d(1, 32, kernel_size=3, stride=1, padding=1)
        self.conv2 = Conv2d(32, 32, kernel_size=3, stride=1, padding=1, residual=True)
        self.conv3 = Conv2d(32, 32, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv4 = Conv2d(32, 64, kernel_size=3, stride=(3, 1), padding=1)
        self.conv5 = Conv2d(64, 64, kernel_size=3, stride=1, padding=1, residual=True)
        self.conv6 = Conv2d(64, 64, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv7 = Conv2d(64, 128, kernel_size=3, stride=3, padding=1)
        self.conv8 = Conv2d(128, 128, kernel_size=3, stride=1, padding=1, residual=True)
        self.conv9 = Conv2d(128, 128, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv10 = Conv2d(128, 256, kernel_size=3, stride=(3, 2), padding=1)
        self.conv11 = Conv2d(256, 256, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv12 = Conv2d(256, 512, kernel_size=3, stride=1, padding=0)
        self.conv13 = Conv2d(512, 512, kernel_size=1, stride=1, padding=0)

    def forward(self, x):
        out = self.conv1(x)
        out = self.conv2(out)
        out = self.conv3(out)

        out = self.conv4(out)
        out = self.conv5(out)
        out = self.conv6(out)

        out = self.conv7(out)
        out = self.conv8(out)
        out = self.conv9(out)

        out = self.conv10(out)
        out = self.conv11(out)

        out = self.conv12(out)
        out = self.conv13(out)

        return out


class FaceDecoder(nn.Module):
    """Decoder to generate lip-synced face"""

    def __init__(self):
        super().__init__()

        # Input: (B, 512, 1, 1) - combined face and audio embeddings
        self.conv1 = Conv2d(512, 512, kernel_size=1, stride=1, padding=0)

        self.conv2 = nn.ConvTranspose2d(512, 512, kernel_size=3, stride=1, padding=0)
        self.bn2 = nn.BatchNorm2d(512)

        self.conv3 = Conv2d(512, 512, kernel_size=3, stride=1, padding=1, residual=True)
        self.conv4 = Conv2d(512, 512, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv5 = nn.ConvTranspose2d(512, 256, kernel_size=3, stride=2, padding=1, output_padding=1)
        self.bn5 = nn.BatchNorm2d(256)

        self.conv6 = Conv2d(256, 256, kernel_size=3, stride=1, padding=1, residual=True)
        self.conv7 = Conv2d(256, 256, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv8 = nn.ConvTranspose2d(256, 128, kernel_size=3, stride=2, padding=1, output_padding=1)
        self.bn8 = nn.BatchNorm2d(128)

        self.conv9 = Conv2d(128, 128, kernel_size=3, stride=1, padding=1, residual=True)
        self.conv10 = Conv2d(128, 128, kernel_size=3, stride=1, padding=1, residual=True)
        self.conv11 = Conv2d(128, 128, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv12 = nn.ConvTranspose2d(128, 64, kernel_size=3, stride=2, padding=1, output_padding=1)
        self.bn12 = nn.BatchNorm2d(64)

        self.conv13 = Conv2d(64, 64, kernel_size=3, stride=1, padding=1, residual=True)
        self.conv14 = Conv2d(64, 64, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv15 = nn.ConvTranspose2d(64, 32, kernel_size=3, stride=2, padding=1, output_padding=1)
        self.bn15 = nn.BatchNorm2d(32)

        self.conv16 = Conv2d(32, 32, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv17 = nn.ConvTranspose2d(32, 16, kernel_size=3, stride=(1, 2), padding=1, output_padding=(0, 1))
        self.bn17 = nn.BatchNorm2d(16)

        self.conv18 = Conv2d(16, 16, kernel_size=3, stride=1, padding=1, residual=True)

        self.conv19 = nn.Conv2d(16, 3, kernel_size=7, stride=1, padding=3)

    def forward(self, x):
        out = self.conv1(x)

        out = F.relu(self.bn2(self.conv2(out)))
        out = self.conv3(out)
        out = self.conv4(out)

        out = F.relu(self.bn5(self.conv5(out)))
        out = self.conv6(out)
        out = self.conv7(out)

        out = F.relu(self.bn8(self.conv8(out)))
        out = self.conv9(out)
        out = self.conv10(out)
        out = self.conv11(out)

        out = F.relu(self.bn12(self.conv12(out)))
        out = self.conv13(out)
        out = self.conv14(out)

        out = F.relu(self.bn15(self.conv15(out)))
        out = self.conv16(out)

        out = F.relu(self.bn17(self.conv17(out)))
        out = self.conv18(out)

        out = torch.sigmoid(self.conv19(out))

        return out


class Wav2Lip(nn.Module):
    """
    Wav2Lip model for lip synchronization

    Takes audio mel spectrogram and face image as input,
    outputs lip-synced face image
    """

    def __init__(self):
        super().__init__()

        self.face_encoder = FaceEncoder()
        self.audio_encoder = AudioEncoder()
        self.face_decoder = FaceDecoder()

    def forward(self, audio, face):
        """
        Forward pass

        Args:
            audio: Audio mel spectrogram (B, 1, 80, 16)
            face: Face image (B, 6, 96, 96)

        Returns:
            Lip-synced face image (B, 3, 96, 96)
        """
        # Encode audio
        audio_embedding = self.audio_encoder(audio)

        # Encode face
        face_embedding = self.face_encoder(face)

        # Combine embeddings
        combined = face_embedding + audio_embedding

        # Decode to generate lip-synced face
        output = self.face_decoder(combined)

        return output


class Wav2LipDiscriminator(nn.Module):
    """
    Discriminator for Wav2Lip GAN training
    Not used for inference, but included for completeness
    """

    def __init__(self):
        super().__init__()

        self.face_encoder = FaceEncoder()
        self.audio_encoder = AudioEncoder()

        self.fc = nn.Sequential(
            nn.Linear(1024, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 1),
        )

    def forward(self, audio, face):
        """
        Forward pass

        Args:
            audio: Audio mel spectrogram (B, 1, 80, 16)
            face: Face image (B, 6, 96, 96)

        Returns:
            Discriminator score (B, 1)
        """
        audio_embedding = self.audio_encoder(audio).view(audio.size(0), -1)
        face_embedding = self.face_encoder(face).view(face.size(0), -1)

        combined = torch.cat([audio_embedding, face_embedding], dim=1)
        output = self.fc(combined)

        return output


def get_model(model_type="wav2lip", device="cpu"):
    """
    Get model instance

    Args:
        model_type: Type of model ("wav2lip" or "discriminator")
        device: Device to load model on

    Returns:
        Model instance
    """
    if model_type == "wav2lip":
        model = Wav2Lip()
    elif model_type == "discriminator":
        model = Wav2LipDiscriminator()
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    return model.to(device)


def load_checkpoint(checkpoint_path, device="cpu"):
    """
    Load model from checkpoint

    Args:
        checkpoint_path: Path to checkpoint file
        device: Device to load model on

    Returns:
        Loaded model
    """
    model = get_model("wav2lip", device)
    checkpoint = torch.load(checkpoint_path, map_location=device)

    if "state_dict" in checkpoint:
        model.load_state_dict(checkpoint["state_dict"])
    else:
        model.load_state_dict(checkpoint)

    model.eval()

    return model
