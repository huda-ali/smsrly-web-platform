using System.Security.Cryptography;
using System.Text;

namespace BusinessLogicLayer.Utilities
{
    public static class MlUserIdMapper
    {
        private static readonly byte[] Namespace = Guid.Parse("f47b3f2e-1c1a-4e9d-9b3a-6d8f2e1a7c3b").ToByteArray();

        public static Guid ToMlUserId(int userId)
        {
            var nameBytes = Encoding.UTF8.GetBytes(userId.ToString());
            var combined = new byte[Namespace.Length + nameBytes.Length];

            Buffer.BlockCopy(Namespace, 0, combined, 0, Namespace.Length);
            Buffer.BlockCopy(nameBytes, 0, combined, Namespace.Length, nameBytes.Length);

            using var sha1 = SHA1.Create();
            var hash = sha1.ComputeHash(combined);

            var guidBytes = new byte[16];
            Array.Copy(hash, guidBytes, 16);

            guidBytes[6] = (byte)((guidBytes[6] & 0x0F) | 0x50); // version 5
            guidBytes[8] = (byte)((guidBytes[8] & 0x3F) | 0x80); // variant

            return new Guid(guidBytes);
        }
    }
}