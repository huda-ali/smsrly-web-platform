using Bll.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppContext _context;

        
        private IUserRepository? _users;
        private IAdminRepository? _admins;
        private IOwnerRepository? _owners;
        private ITenantRepository? _tenants;
        private IPropertyRepository? _properties;
        private IMessageRepository? _messages;
        private IReviewRepository? _reviews;
        private IServiceRepository? _services;
        private IPreferencesRepository? _preferences;

        public UnitOfWork(AppContext context)
        {
            _context = context;
        }

        public IUserRepository Users => _users ??= new UserRepository(_context);
        public IAdminRepository Admins => _admins ??= new AdminRepository(_context);
        public IOwnerRepository Owners => _owners ??= new OwnerRepository(_context);
        public ITenantRepository Tenants => _tenants ??= new TenantRepository(_context);
        public IPropertyRepository Properties => _properties ??= new PropertyRepository(_context);
        public IMessageRepository Messages => _messages ??= new MessageRepository(_context);
        public IReviewRepository Reviews => _reviews ??= new ReviewRepository(_context);
        public IServiceRepository Services => _services ??= new ServiceRepository(_context);
        public IPreferencesRepository Preferences => _preferences ??= new PreferencesRepository(_context);

        public int Complete() => _context.SaveChanges();

        public void Dispose() => _context.Dispose();

    }
}
