using FluentValidation;

namespace Tasko.Application.Handlers.Notifications.Commands.UpdatePreferences;

public sealed class UpdateNotificationPreferencesCommandValidator : AbstractValidator<UpdateNotificationPreferencesCommand>
{
    public UpdateNotificationPreferencesCommandValidator()
    {
        RuleFor(x => x).NotNull();
    }
}
