using System.Security.Cryptography;
using CarbonBill.Modules.IdentityTenancy.Domain;
using CarbonBill.Modules.IdentityTenancy.Persistence;
using CarbonBill.SharedKernel.Domain;
using Microsoft.EntityFrameworkCore;

namespace CarbonBill.Modules.IdentityTenancy.Services;

public record CreateInvitationRequest(
    Guid OrgId,
    string Role,
    string Pin,
    TimeSpan ValidityPeriod,
    Guid CreatedByUserId,
    int MaxUses = 1);

public record JoinWithInvitationRequest(
    string Token,
    string Pin,
    string FullName,
    string? PhoneNumber,
    string? Email = null,
    string? Password = null);

public interface IInvitationService
{
    Task<Result<Invitation>> CreateInvitationAsync(CreateInvitationRequest request, CancellationToken cancellationToken = default);
    Task<Result<(User User, Membership Membership)>> JoinWithInvitationAsync(JoinWithInvitationRequest request, CancellationToken cancellationToken = default);
}

public class InvitationService(
    IdentityTenancyDbContext dbContext,
    IPasswordHasher passwordHasher) : IInvitationService
{
    public async Task<Result<Invitation>> CreateInvitationAsync(CreateInvitationRequest request, CancellationToken cancellationToken = default)
    {
        if (!Roles.IsValid(request.Role))
        {
            return Result.Failure<Invitation>($"Invalid role '{request.Role}'.");
        }

        var org = await dbContext.Organizations.FindAsync([request.OrgId], cancellationToken);
        if (org == null)
        {
            return Result.Failure<Invitation>($"Organization with id {request.OrgId} was not found.");
        }

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
        var pinHash = passwordHasher.HashPassword(request.Pin);

        var invitation = new Invitation
        {
            OrgId = request.OrgId,
            Role = request.Role,
            Token = token,
            PinHash = pinHash,
            ExpiresAtUtc = DateTime.UtcNow.Add(request.ValidityPeriod),
            CreatedByUserId = request.CreatedByUserId,
            MaxUses = request.MaxUses,
            UseCount = 0
        };

        dbContext.Invitations.Add(invitation);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(invitation);
    }

    public async Task<Result<(User User, Membership Membership)>> JoinWithInvitationAsync(
        JoinWithInvitationRequest request,
        CancellationToken cancellationToken = default)
    {
        var invitation = await dbContext.Invitations
            .Include(i => i.Organization)
            .FirstOrDefaultAsync(i => i.Token == request.Token, cancellationToken);

        if (invitation == null)
        {
            return Result.Failure<(User, Membership)>("Invalid invitation token.");
        }

        if (!invitation.IsValid())
        {
            return Result.Failure<(User, Membership)>("Invitation is expired or has reached its maximum uses.");
        }

        if (!passwordHasher.VerifyPassword(request.Pin, invitation.PinHash))
        {
            return Result.Failure<(User, Membership)>("Incorrect PIN provided for this invitation.");
        }

        // Check or create user
        var email = !string.IsNullOrWhiteSpace(request.Email)
            ? request.Email.Trim().ToLowerInvariant()
            : $"floor_{invitation.Token[..8]}@carbonbill.local";

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user == null)
        {
            var defaultPassword = request.Password ?? Guid.NewGuid().ToString("N");
            user = new User
            {
                Email = email,
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                PasswordHash = passwordHasher.HashPassword(defaultPassword),
                PreferredLanguage = "bn"
            };
            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        // Check if membership already exists
        var existingMembership = await dbContext.Memberships
            .FirstOrDefaultAsync(m => m.UserId == user.Id && m.OrgId == invitation.OrgId, cancellationToken);

        Membership membership;
        if (existingMembership != null)
        {
            membership = existingMembership;
            membership.Role = invitation.Role;
            membership.IsActive = true;
        }
        else
        {
            membership = new Membership
            {
                UserId = user.Id,
                OrgId = invitation.OrgId,
                Role = invitation.Role,
                IsActive = true
            };
            dbContext.Memberships.Add(membership);
        }

        invitation.UseCount++;
        invitation.UsedByUserId = user.Id;
        invitation.UsedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success((user, membership));
    }
}
